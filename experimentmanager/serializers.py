from rest_framework import serializers
from . import models


class CommonPropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CommonProperty
        fields = '__all__'


class InitialSpecieSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InitialSpecie
        fields = '__all__'


class DataColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.DataColumn
        fields = '__all__'


class FilePaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.FilePaper
        fields = '__all__'

class ExperimentSerializer(serializers.ModelSerializer):
    common_properties = CommonPropertySerializer(many=True, read_only=True)
    initial_species = InitialSpecieSerializer(many=True, read_only=True)
    file_paper = FilePaperSerializer(read_only=True)

    class Meta:
        model = models.Experiment
        fields = ('id', 'reactor', 'experiment_type', 'fileDOI', 'file_paper', 'common_properties', 'initial_species', 'run_type_str')


class ChemModelSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.ChemModel
        fields = ('id', 'name')


class ExperimentDetailSerializer(serializers.ModelSerializer):
    common_properties = CommonPropertySerializer(many=True, read_only=True)
    initial_species = InitialSpecieSerializer(many=True, read_only=True)
    data_columns = DataColumnSerializer(many=True, read_only=True)

    class Meta:
        model = models.Experiment
        fields = ('id', 'reactor', 'experiment_type', 'fileDOI', 'file_paper', 'common_properties', 'initial_species', 'data_columns')


