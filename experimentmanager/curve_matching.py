import shutil, os, glob
import numpy as np
import subprocess
import pandas as pd
from . import models
from pint import UnitRegistry

ureg = UnitRegistry()


def normalize_execution_column(execution_column, experiment=None, target_column=None):
    if execution_column.species is not None:
        return execution_column.data

    if experiment is None and target_column is None:
        experiment = execution_column.execution.experiment
        target_column = experiment.data_columns.all().get(name=execution_column.name)
    elif experiment is not None and target_column is None:
        target_column = experiment.data_columns.all().get(name=execution_column.name)

    target_units = target_column.units

    return [(float(t) * ureg.parse_expression(execution_column.units)).to(target_units).magnitude for t in
            execution_column.data]


# for curve matching
def get_experiment_table(exp_id, reorder=True):
    dc = models.DataColumn.objects.filter(experiment_id=exp_id)
    column_names = [d.name.replace(" ", "-") if d.species is None else d.species[0] for d in dc]
    column_data = [[float(dd) for dd in d.data] for d in dc]
    r = pd.DataFrame(dict(zip(column_names, column_data)))

    if reorder:
        e = models.Experiment.objects.get(pk=exp_id)
        if e.reactor == "shock tube" and e.experiment_type == "ignition delay measurement" or e.reactor == "stirred reactor":
            column_names.remove("temperature")
            column_names.insert(0, "temperature")
            r = r[column_names]
    return r


def get_models_table(exp_id, target_models=None, reorder=True, split=False):
    if target_models is None:
        target_models = []

    executions = models.Execution.objects.filter(experiment=exp_id, chemModel__in=target_models)

    data_frames = []
    for execution in executions:
        ec = execution.execution_columns.all()

        column_names = [d.name.replace(" ", "-") if d.species is None else d.species[0] for d in ec]
        column_data = [[float(dd) for dd in normalize_execution_column(d)] for d in ec]
        r = pd.DataFrame(dict(zip(column_names, column_data)))

        if reorder:
            e = models.Experiment.objects.get(pk=exp_id)
            if e.reactor == "shock tube" and e.experiment_type == "ignition delay measurement" or e.reactor == "stirred reactor":
                column_names.remove("temperature")
                column_names.insert(0, "temperature")
                r = r[column_names]

        r.columns = [i + "_" + execution.chemModel.name for i in r.columns]
        data_frames.append(r)

    if not split:
        return pd.concat(data_frames, axis=1, sort=False)
    return data_frames


class CurveMatchingExecutor():
    def __init__(self, curve_matching_path, output_path):
        self.curve_matching_path = curve_matching_path
        self.output_path = output_path

    def execute_CM(self, exp_id, target_models=None, store_results=False):
        # TODO: check if already executed

        dataframes = self.get_CM_dataframes(exp_id, target_models=None)
        self.flush_output_folder()
        self.write_CM_dataframes(dataframes)
        out = self.__execute()

        if out.returncode != 0:
            return None

        results = self.extract_CM_results()

        if store_results:
            self.store_results(results, exp_id)

        return results

    def __execute(self):
        command = os.path.join(self.curve_matching_path, r"Curve Matching.exe")
        out = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True,
                             cwd=self.curve_matching_path)
        return out

    def extract_CM_results(self):
        path = os.path.join(self.curve_matching_path, 'Results', '*Kmatrix*.csv')
        path = glob.glob(path)[0]
        df = pd.read_csv(path, header=[0, 1], index_col=0)
        columns = pd.DataFrame(df.columns.tolist())
        columns.loc[columns[0].str.startswith('Unnamed:'), 0] = np.nan
        columns[0] = columns[0].fillna(method='ffill')
        df.columns = pd.MultiIndex.from_tuples(columns.to_records(index=False).tolist())
        return df

    # for an experiment and a set of models (default: all the available models for the experiment)
    # returns a list [(e1, m1), (e2, m2), ...] of experiment/model dataframes as needed for CurveMatching
    def get_CM_dataframes(self, exp_id, target_models=None):
        exp_table = get_experiment_table(exp_id)
        models_table = get_models_table(exp_id, target_models=target_models)

        r = []
        x_axis = exp_table.columns[0]
        for i in range(1, len(exp_table.columns)):
            column = exp_table.columns[i]

            columns_exp = exp_table[[x_axis, column]]

            mc = [c for c in models_table.columns if c.startswith(x_axis + "_") or c.startswith(column + "_")]

            columns_mod = models_table[mc]

            r.append((columns_exp, columns_mod))
        return r

    def flush_output_folder(self):
        shutil.rmtree(self.output_path)
        os.makedirs(self.output_path)

    def write_CM_dataframes(self, dataframes):
        for i in dataframes:
            name = i[0].columns[1]
            i[0].to_csv(os.path.join(self.output_path, name + "_exp.txt"), sep="\t", index=False)
            i[1].to_csv(os.path.join(self.output_path, name + "_mod.txt"), sep="\t", index=False)

    def store_results(self, r, exp_id):
        for index, row in r.iterrows():
            ecs = models.ExecutionColumn.objects.filter(execution__chemModel__name=index, execution__experiment=exp_id)

            for d in ecs:
                name = d.name.replace(" ", "-") if d.species is None else d.species[0]
                if name in row:
                    index, error = row[name]['Index'], row[name]['Error']
                    cm = models.CurveMatchingResult(index=index, error=error, execution_column=d)
                    cm.save()