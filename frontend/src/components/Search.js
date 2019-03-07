
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {
    Tag,
    Button,
    Menu,
    Dropdown,
    Icon,
    Table,
    Divider,
    Card,
    Cascader,
    Form,
    Row,
    Col,
    Input,
    Select,
    Modal,
    Tabs,
    message,
    Tooltip,
    Popover,
    Alert,
    Drawer,
    List,
    Avatar,
    Collapse
} from 'antd';
import 'antd/dist/antd.css';  // or 'antd/dist/antd.less'
import Plot from 'react-plotly.js';



import './index.css';
import registerServiceWorker from './registerServiceWorker';
import ReactTable from "react-table";
import axios from 'axios';
import matchSorter from 'match-sorter';

import ReactDataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';


import {DataTable} from 'antd-data-table'

import ReactChartkick, {LineChart, PieChart} from 'react-chartkick'

import {GenericMultiDraw} from './Components'




const TabPane = Tabs.TabPane;
const Panel = Collapse.Panel;


function CommonPropertiesList(props) {
    const common_properties = props.common_properties;
    const listItems = common_properties.map((common_property) =>
        <div key={common_property.id} style={{fontSize: 12}}>
            <span>{common_property.name}</span>: <span style={{fontFamily: 'monospace'}}>{parseFloat(common_property.value).toFixed(2)} {common_property.units}</span>
        </div>
    );
    return (
        <div>{listItems}</div>
    );
}

function InitialSpeciesList(props) {
    const initial_species = props.initial_species;
    const listTags = initial_species.map((initial_specie) =>
        <Tag key={initial_specie.id}>{initial_specie.name}</Tag>
    );
    return (
        <div>{listTags}</div>
    )
}

const FormItem = Form.Item;


class CMBars extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            response: [],
        }

    }

    render() {
        const bars = this.state.response.map((item) =>
        {
            return({name: item.model, type: 'bar', x:  Object.keys(item.data), y: Object.values(item.data)})
        });
        return(
               <Plot
                   data={bars}
                   useResizeHandler={true}
                   style={{width: "100%", height: "100%"}}
                   layout={{

                       autosize: true
                   }}
                   config={{displaylogo: false, showLink: false, modeBarButtonsToRemove: ['sendDataToCloud']}}

               />
        )
    }

      componentDidMount() {
        axios.get('experimentmanager/api/curve_matching_global_results_dict', {
            params: {
                experiments: this.props.experiments,
                chemModels: this.props.chemModels,
            }
        })
            .then(res => {
                const response = res.data;
                this.setState({response: response});
            })
    }
}

class ExperimentDraw extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            response: {},
            error: null,
        }
    }

    render() {
        if (this.state.error) {
            return (
                <Alert message={this.state.error.data} type="warning" />
            )
        }

        return (
            <GenericMultiDraw response={this.state.response} />
        );
    }

    componentDidMount() {
        const exp_id = this.props.experiment.id;

        axios.get('experimentmanager/api/experiment/curves/' + exp_id.toString())
            .then(res => {
                const response = res.data;
                this.setState({response: response});
                console.log(this.state.response.curves)
            }).catch(error => {
                console.log(error.response)
                this.setState({error: error.response})
        })
    }

}


class SearchPanelRaw
    extends React
        .Component {
    constructor(props) {
        super(props);
        this.state = {reactors: [], reactors_to_types: {}, species: [], experiment_types: []}
    }

    componentDidMount() {
        axios.get('experimentmanager/api/experiments/searchfields')
            .then(res => {
                const fields = res.data;
                this.setState({
                    reactors: fields.reactors,
                    reactors_to_types: fields.reactors_to_types,
                    species: fields.species
                });
            })
    }

    handleSearch = (e) => {
        e.preventDefault();

        this.props.form.validateFields((err, values) => {
            //console.log('Received values of form: ', values);
            if (!err)
            {
                this.props.handleSearchValues(values)
            }
        });
    };

    handleReset = () => {
        this.props.form.resetFields();
    };

    handleReactorChange = (reactor) => {
        if (reactor === undefined) {
            this.setState({experiment_types: []});
            this.props.form.setFieldsValue({experiment_type: undefined})

        }
        else {
            this.setState({experiment_types: this.state.reactors_to_types[reactor]});
            this.props.form.setFieldsValue({experiment_type: undefined})
        }
    };

    render() {
        const {getFieldDecorator, getFieldsError} = this.props.form;
        const formItemLayout = {
            labelCol: {
                sm: {span: 8},
            },
            wrapperCol: {
                sm: {span: 16},
            },
        };


        const reactorOptions = this.state.reactors.map((reactor) =>
            <Select.Option value={reactor} key={reactor}>{reactor}</Select.Option>
        );

        const experimentTypeOptions = this.state.experiment_types.map((et) =>
            <Select.Option value={et} key={et}>{et}</Select.Option>
        );

        const speciesOptions = this.state.species.map((specie) =>
            <Select.Option value={specie} key={specie}>{specie}</Select.Option>
        );

        const searchQueryGuide = (
            <div>
                <p>Supported variables: p, T, phi</p>
                <p>Supported symbols: AND, OR, (, ), ==, !=, &lt;, &lt;=, &gt;, &gt;= </p>
                <p>All the variables and symbols are case-insensitive, spaces are ignored</p>
            </div>
        );

        const searchQueryRegExp = 'abc';


        return (
            <Form layout={"horizontal"}
                //className="ant-advanced-search-form"
                  onSubmit={this.handleSearch}
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <FormItem {...formItemLayout} label={"Reactor"}>
                            {getFieldDecorator('reactor', {
                                //rules: [{required: true, message: 'Please insert a reactor.'}],
                            })(
                                <Select placeholder="Select a reactor"
                                        onChange={(value) => this.handleReactorChange(value)} allowClear={true}
                                >
                                    {reactorOptions}
                                </Select>
                            )}
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem {...formItemLayout} label={"Experiment type"}>
                            {getFieldDecorator('experiment_type', {
                                //rules: [{required: true, message: 'Please insert an experiment type.'}],
                            })(
                                <Select disabled={this.state.experiment_types.length === 0} placeholder="Select a type"
                                        onChange={(value) => console.log(value)} allowClear={true}>
                                    {experimentTypeOptions}
                                </Select>
                            )}
                        </FormItem>
                    </Col>
                </Row>
                <Row gutter={24}>
                    <Col span={24}>
                        <FormItem {...formItemLayout} label={"Input species"}>
                            {getFieldDecorator('species', {
                                //rules: [{required: true, message: 'Please insert an experiment type.'}],
                            })(
                                <Select placeholder="Select species" mode="multiple" allowClear={true}
                                        onChange={(value) => console.log(value)}>
                                    {speciesOptions}
                                </Select>
                            )}
                        </FormItem>
                    </Col>
                </Row>
                <Row gutter={24}>
                    {/*<Col span={8}>*/}
                    {/*<FormItem {...formItemLayout} label={"Temperature"}>*/}

                    {/*{getFieldDecorator('temperature', {*/}
                    {/*//rules: [{required: true, message: 'Please insert an experiment type.'}],*/}
                    {/*})(*/}
                    {/*<Input.Group compact>*/}
                    {/*<Input style={{width: 80, textAlign: 'center'}} placeholder="Min"/>*/}
                    {/*<Input*/}
                    {/*style={{*/}
                    {/*width: 30,*/}
                    {/*borderLeft: 0,*/}
                    {/*pointerEvents: 'none',*/}
                    {/*backgroundColor: '#fff'*/}
                    {/*}}*/}
                    {/*placeholder="~" disabled/>*/}
                    {/*<Input style={{width: 80, textAlign: 'center', borderLeft: 0}}*/}
                    {/*placeholder="Max"/>*/}
                    {/*<Select defaultValue="1">*/}
                    {/*<Select.Option value="1">atm</Select.Option>*/}
                    {/*<Select.Option value="2">bar</Select.Option>*/}
                    {/*</Select>*/}
                    {/*</Input.Group>*/}
                    {/*)}*/}

                    {/*</FormItem>*/}
                    {/*</Col>*/}
                    <Col span={22}>


                        <FormItem {...formItemLayout} label={"Filter condition"}>
                            {getFieldDecorator('filter_condition', {
                                //rules: [{required: true, message: 'Please insert a reactor.'}],
                                //(phi|p|T|\(|\)|AND|OR| )
                                rules: [{

                                    pattern: new RegExp("^(phi|p|T|\\(|\\)|AND|OR|>|<|>=|<=|[0-9]|\.| )*$"),
                                    message: "Invalid character"
                                }],
                            })(
                                <Input placeholder="Insert filter condition"/>
                            )}
                        </FormItem>

                    </Col>
                    <Col span={2}>
                        <Popover placement="right" content={searchQueryGuide}>
                            <Button type="secondary" shape="circle" icon="question"/>
                        </Popover>
                    </Col>


                </Row>
                <Row gutter={24}>
                    <Col span={24} style={{textAlign: 'right'}}>
                        <Button type="primary" htmlType="submit" loading={this.props.loading}>Search</Button>
                        <Button style={{marginLeft: 8}} onClick={this.handleReset}>
                            Clear
                        </Button>
                    </Col>
                </Row>
            </Form>
        );
    }
}

const SearchPanel = Form.create()(SearchPanelRaw);

class SearchTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        const selectedRowKeys = this.props.selectedRowKeys;
        const handleSelectChange = this.props.handleSelectChange;
        const rowSelection = {
            selectedRowKeys,
            onChange: handleSelectChange,
        };
        const hasSelected = selectedRowKeys.length > 0;

        const columns = [{
            title: 'File DOI',
            dataIndex: 'fileDOI',
            key: 'fileDOI',
            sorter: (a, b) => {
                return a.fileDOI.localeCompare(b.fileDOI)
            },
            width: 160,

        }, {
            title: 'Id',
            dataIndex: 'id',
            key: 'id',
            width: 50
        }, {
            title: 'Paper',
            dataIndex: 'file_paper.title',
            key: 'file_paper.title',
            width: 160
        }, {
            title: 'Reactor',
            dataIndex: 'reactor',
            key: 'reactor',

            sorter: (a, b) => {
                return a.reactor.localeCompare(b.reactor)
            },
            width: 140
        },
        //     {
        //     title: 'Experiment type',
        //     dataIndex: 'experiment_type',
        //     key: 'experiment_type',
        //     width: 150
        //     //sorter: (a, b) => { return a.experiment_type.localeCompare(b.experiment_type)},
        // },
            {
            title: 'Properties',
            dataIndex: 'common_properties',
            key: 'common_properties',
            render: p => <CommonPropertiesList common_properties={p}/>,
            width: 150
        }, {
            title: 'Initial species',
            dataIndex: 'initial_species',
            key: 'initial_species',
            render: p => <InitialSpeciesList initial_species={p}/>,
            width: 80
        },];

        return (
            <div>
                <span style={{marginLeft: 8}}>
            {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
            </span>
                <Table rowSelection={rowSelection} columns={columns} dataSource={this.props.experiments} rowKey="id"
                       loading={this.props.loading} pagination={false}
                       bordered
                       expandedRowRender={record => {return <ExperimentDraw experiment={record}/>}}
/>
            </div>
        )
    }
}


class ModelTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            models: [],
            loading: true
        }
    }

    componentDidMount() {
        this.setState({loading: true});

        axios.get('experimentmanager/api/models/')
            .then(res => {
                const models = res.data;
                this.setState({models: models, loading: false});
            })
    }

    render() {

        const rowSelection = {
            onChange: (selectedRowKeys, selectedRows) => {
                this.props.onChangeParameters({'selectedModels': selectedRows.map((sr) => sr.id)})
            }
        };

        const columns = [{
            title: 'Model',
            dataIndex: 'name',
            key: 'name',
        }];

        return (
            <Table rowSelection={rowSelection} columns={columns} dataSource={this.state.models} rowKey={"id"}
                   loading={this.state.loading}
                   pagination={false} bordered/>
        )
    }

}

class DetailAction extends React.Component {

    constructor(props) {
        super(props);

    }

    render() {


        return (
            <Modal
                title={this.props.action}
                visible={this.props.action.length > 0}
                onOk={this.props.handleOkAction}
                onCancel={this.props.handleCancelAction}
            >
                {this.generate_content()}
            </Modal>
        );
    }

    generate_content() {
        if (this.props.action === 'Opensmoke' || this.props.action === 'Curve Matching') {
            return (
                <div>
                    <ModelTable onChangeParameters={this.props.onParametersChanged}/>
                </div>
            )
        }
    }
}




class ExecuteAction extends React.Component {
    render() {
        const menu = (
            <Menu onClick={this.props.handleSelectAction}>
                <Menu.Item key="Opensmoke">Opensmoke</Menu.Item>
                <Menu.Item key="Curve Matching">Curve Matching</Menu.Item>
                <Menu.Item key="3">Action 3</Menu.Item>
            </Menu>
        );
        return (
            <Dropdown overlay={menu} disabled={this.props.disabled}>
                <Button type="primary" style={{marginLeft: 8}}>
                    Execute <Icon type="down"/>
                </Button>
            </Dropdown>
        )
    }
}

class ExperimentExecutionsCMDetails extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ExperimentExecutionsCMList experimentList={this.experiments}
                                        chemModelsList={this.parameters.selectedModels}/>
        )
    }
}

class OutputEntry extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        const item = this.props.item;
        const exp_ids = item.experiments.map((i) => i.id);
        return (
            <Collapse bordered={false} >
                <Panel header="Results" key="1">
                    <div>
                    <CurveMatchingTable experiments={exp_ids}
                                        details={"1"}
                                        chemModels={item.actionParameters.selectedModels}/>
                    </div>

                     <CMBars experiments={exp_ids}
                        chemModels={item.actionParameters.selectedModels}/>
                </Panel>


            </Collapse>


        )
    }
}

class OutputMenu extends React.Component {
    constructor(props) {
        super(props)
         this.state = {
            detailDrawerVisible: false,
             detailAction: null
        };
    }

    showDetailDrawer = (action) => {
        this.setState({
            detailDrawerVisible: true,
            detailAction: action
        });
    };

    onCloseDetailDrawer = () => {
        this.setState({
            detailDrawerVisible: false,
        });
    };

    getDrawerContent = () => {
        if (this.state.detailAction == null) {
            return (<div/>)
        }
        else {
            console.log(this.state.detailAction)
            return (
                 <ExperimentExecutionsCMList experiments={this.state.detailAction.experiments} chemModelsList={this.state.detailAction.actionParameters.selectedModels}/>
            )
        }

    };

    downloadResume = (action) => {
       axios.get('experimentmanager/api/curve_matching_global_results/download', {
            params: {
                experiments: action.experiments.map((i) => i.id),
                chemModels: action.actionParameters.selectedModels
            },
           responseType: 'blob',
           timeout: 30000
        })
            .then(res => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;

                const file_name = "curvematching.xlsx"
                link.setAttribute('download', file_name);

                document.body.appendChild(link);
                link.click();
                message.success('Excel resume downloaded')
            })
            .catch(function (error) {
                // handle error
                console.log(error);
                message.error('Error')
            })
    };

    render() {
        const actionList = this.props.actionList;

        if (actionList.length === 0) {
            return null

        }

        const outputList = <List

            dataSource={actionList}
            itemLayout={"vertical"}
            bordered
            renderItem={(item, index) => (
                <List.Item key={index} actions={[<a onClick={() => this.showDetailDrawer(item)}>Details</a>, <a download onClick={() => this.downloadResume(item)}>Download</a>]}>
                    <List.Item.Meta
                        //avatar={
                        //    <Avatar src="https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png"/>
                        //}
                        title={"<" + (index + 1) + "> " + item.action}
                        description={
                            <div style={{width: 350}}>
                                <p>
                            {item.experiments.length + " experiments"} {"/ " + item.searchValues.reactor + (item.searchValues.filter_condition == null ?  " / all conditions" : (" / " + item.searchValues.filter_condition)) + (item.searchValues.species == null ?  " / all species" : (" / " + item.searchValues.species))}
                                </p>

                                <OutputEntry item={item}/>
                            </div>

                        }
                    />
                </List.Item>
            )}
        />;


        const detailDrawer = <Drawer
            title="Details"
            placement="right"
            closable={true}
            onClose={this.onCloseDetailDrawer}
            visible={this.state.detailDrawerVisible}
            destroyOnClose={true}
            width={900}
        >
            {this.getDrawerContent()}
        </Drawer>

        return(
            <div>{outputList}
                {detailDrawer}</div>
            //<div>{output_entries}</div>
            //<ExperimentExecutionsCMList experimentList={experiments} chemModelsList={parameters.selectedModels}/>
        )
    }
}



class SearchAndExecute extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchValues: {},
            loading: false,
            experiments: [],
            selectedRowKeys: [],
            selectedRows: [],
            action: "",
            actionParameters: {},
            actionList: []
        };
        this.handleSearchValues = this.handleSearchValues.bind(this);

    }

    handleSelectChange = (selectedRowKeys, selectedRows) => {
        this.setState({selectedRowKeys, selectedRows});
    };

    clearValues = () => {
        this.setState({
            selectedRowKeys: [],
        })
    };

    handleSearchValues(values) {
        console.log(values)
        this.retrieveExperiments(values);
        this.setState(
            {
                searchValues: values
            }
        );
        this.clearValues();
    }

    handleSelectAction = (e) => {
        this.setState(
            {action: e.key}
        )
    };

    handleOkAction = (e) => {
        const actionList = this.state.actionList.push({action: this.state.action, actionParameters: this.state.actionParameters, experiments: this.state.selectedRows, searchValues: this.state.searchValues})
        if (this.state.action === 'Curve Matching') {

        }
        this.setState({
            action: "",
            actionParameters: {}
        });


    };

    handleParametersChanged = (parameters) => {
        this.setState({
            actionParameters: parameters
        })
    };

    handleCancelAction = (e) => {
        this.setState({
            action: "",
        });
    };

    retrieveExperiments(searchValues) {
        this.setState({loading: true});
        axios.get('experimentmanager/api/experiments/search', {
            params: {
                reactor: searchValues.reactor,
                experiment_type: searchValues.experiment_type,
                complex_query: searchValues.filter_condition,
                species: searchValues.species
            }
        })
            .then(res => {
                const experiments = res.data;
                this.setState({experiments: experiments});
                this.setState({loading: false});
            }).catch((error) => {
            // handle error
            console.log(error);
            message.error('Error parsing the filter condition')
            this.setState({loading: false});
        })
    }

    render() {
        return (
            <Row gutter={16} style={{'width': '100%'}}>
                <Col span={16}>
                    <div>

                        <SearchPanel handleSearchValues={this.handleSearchValues} loading={this.state.loading}/>
                        <ExecuteAction handleSelectAction={this.handleSelectAction}
                                       disabled={this.state.selectedRowKeys.length == 0}/>
                        <SearchTable experiments={this.state.experiments} loading={this.state.loading}
                                     handleSelectChange={this.handleSelectChange}
                                     selectedRowKeys={this.state.selectedRowKeys}/>

                        <DetailAction action={this.state.action} handleOkAction={this.handleOkAction}
                                      handleCancelAction={this.handleCancelAction}
                                      onParametersChanged={this.handleParametersChanged}/>
                    </div>
                </Col>
                <Col span={8}>
                    <OutputMenu actionList={this.state.actionList}/>
                </Col>
            </Row>)

    }
}


class ExperimentExecutionsDraw extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            response: {},
        }
    }

    render() {
        return (
            <GenericMultiDraw response={this.state.response}/>
        );
    }

    componentDidMount() {

        axios.get('experimentmanager/api/opensmoke/curves', {
            params: {
                experiment: this.props.experiment,
                chemModels: this.props.chemModels
            }
        })
            .then(res => {
                const response = res.data;
                this.setState({response: response});
            })
    }

}

class CurveMatchingTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            names: [],
            data: [],
        }
    }

    render() {
        const data = this.state.data;
        const names = this.state.names;

        if (data == null || names.data === 0) {
            return null;
        }

        const columns_p = names.map(function (name) {
            return {
                title: name,  children: [{
                    title: 'Index',
                    key: name.concat('_index'),
                    dataIndex: name.concat('_index'),
                    width: 100
                }, {
                    title: 'Error',
                    key: name.concat('_error'),
                    dataIndex: name.concat('_error'),
                    width: 100

                }]
            }
        });

        const column_model = [{
            title: 'Model',
            dataIndex: 'model', // String-based value accessors!
            key: 'model',
            fixed: 'left',
            width: 100
        }, {
            title: 'Average',
            children: [{
                    title: 'Index',
                    key: 'average_index',
                    dataIndex: 'average_index',
                    width: 100
                }, {
                    title: 'Error',
                    key: 'average_error',
                    dataIndex: 'average_error',
                    width: 100

                }]
        }];

        const columns = column_model.concat(columns_p)

        const total_width = (names.length * 100 * 2) + 100 + 200;
        return (
            <div>
                <Table
                    dataSource={data}
                    columns={columns}
                    scroll={{ x:  total_width }}
                    size = 'small'
                    pagination = {false}
                    bordered
               />
            </div>)

    }

    componentDidMount() {
        axios.get('experimentmanager/api/curve_matching_global_results', {
            params: {
                experiments: this.props.experiments,
                chemModels: this.props.chemModels,
                details: this.props.details,
            }
        })
            .then(res => {
                const response = res.data;
                this.setState({names: response.names, data: response.data});
            })
    }
}

class CurveMatchingTableOld extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            names: [],
            data: {}
        }
    }

    render() {
        const data = this.state.data;
        const names = this.state.names;

        if (names.length === 0) {
            return null;
        }

        const columns_p = names.map(function(name) {
            return {Header: name, columns:  [{
                Header: 'Index',
                accessor: name.concat('_index')
            }, {
                Header: 'Error',
                accessor: name.concat('_error')
            }]}
        });

        const column_model = [{
            Header: 'Model', columns: [{
                Header: '',
                accessor: 'model' // String-based value accessors!
            }]
        }];

        const columns = column_model.concat(columns_p)

        return (
            <div>
                <ReactTable
                    data={data}
                    columns={columns}/>
            </div>)

    }

    componentDidMount() {
        console.log(this.props.chemModels)
        axios.get('experimentmanager/api/curve_matching_results',  {
            params: {
                experiment: this.props.experiment,
                chemModels: this.props.chemModels
            }
        })
            .then(res => {
                const response = res.data;
                this.setState({names: response.names, data: response.data});

            })
    }
}

class CurveMatchingResult extends React.Component {
    constructor(props) {
        super(props)
    }

    handleClick = (e) => {
        const exp_id = this.props.experiment;
        const model_ids = this.props.chemModels;

        if (e.key === 'input') {
            const request_url = 'experimentmanager/api/experiment/download/input_file/' + exp_id.toString();
            axios.get(request_url, {
                responseType: 'blob',
                timeout: 30000
            })
                .then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;

                    const file_name = exp_id + ".dic"
                    link.setAttribute('download', file_name);

                    document.body.appendChild(link);
                    link.click();
                    message.success('Opensmoke input file downloaded')
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                    message.error('Error')
                })
        }

        else if (e.key === 'experiment_excel') {

            const request_url = 'experimentmanager/api/experiment/download/excel/' + exp_id.toString();
            axios.get(request_url, {
                responseType: 'blob',
                timeout: 30000
            })
                .then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;

                    const file_name = exp_id + ".xlsx"
                    link.setAttribute('download', file_name);

                    document.body.appendChild(link);
                    link.click();
                    message.success('Excel file downloaded')
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                    message.error('Error')
                })
        }

         else if (e.key === 'output_folders') {

            const request_url = 'experimentmanager/api/opensmoke/download/output';
            axios.get(request_url, {
                responseType: 'blob',
                timeout: 30000,
                params: {
                    experiment: exp_id,
                    chemModels: model_ids,
                }
            })
                .then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;

                    const _n = model_ids.join(",");
                    const file_name = `${exp_id}__${_n}.zip`;

                    link.setAttribute('download', file_name);

                    document.body.appendChild(link);
                    link.click();
                    message.success('Output folder downloaded')
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                    message.error('Error')
                })
        }
    };


    render() {

        const menu = (
            <Menu onClick={this.handleClick}>
                <Menu.SubMenu title="Experiment">
                    <Menu.Item disabled key="xml">XML Respecth</Menu.Item>
                    <Menu.Item key="experiment_excel">Excel</Menu.Item>
                    <Menu.Item key="input">Opensmoke input</Menu.Item>
                </Menu.SubMenu>
                <Menu.SubMenu title="Opensmoke">
                    <Menu.Item key="output_folders">Output Folders</Menu.Item>
                    <Menu.Item disabled key="opensmoke_excel">Excel</Menu.Item>
                </Menu.SubMenu>
                <Menu.SubMenu title="Curve Matching">
                    <Menu.Item key="curve_matching_excel">Excel</Menu.Item>
                    <Menu.Item disabled key="curve_matching_folders">Output Folders</Menu.Item>
                </Menu.SubMenu>

            </Menu>
        );


        return (
            <div>
                <Row type="flex" justify="center">
                    <Dropdown overlay={menu}>
                        <Button style={{display: 'flex', justifyContent: 'center'}} type="primary"
                                icon="download">Download</Button>
                    </Dropdown>
                </Row>
                <ExperimentExecutionsDraw experiment={this.props.experiment} chemModels={this.props.chemModels}/>
                <CurveMatchingTable experiments={[this.props.experiment]} chemModels={this.props.chemModels} details={"1"}/>

            </div>
        )
    }


}


class ExperimentExecutionsList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const experimentList = this.props.experimentList;
        const chemModelList = this.props.chemModelsList;
        return experimentList.map((experiment_id) => <p><div><ExperimentExecutionsDraw experiment={experiment_id}
                                                                                    chemModels={chemModelList}/>
</div><Divider /></p>)
    }
}

class ExperimentExecutionsCMList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {

         const columns = [{
            title: 'File DOI',
            dataIndex: 'fileDOI',
            key: 'fileDOI',
            sorter: (a, b) => {
                return a.fileDOI.localeCompare(b.fileDOI)
            },
            width: 70,

        }, {
            title: 'Id',
            dataIndex: 'id',
            key: 'id',
            width: 50
        }, {
            title: 'Paper',
            dataIndex: 'file_paper',
            key: 'file_paper',
            width: 80
        }, {
            title: 'Reactor',
            dataIndex: 'reactor',
            key: 'reactor',

            sorter: (a, b) => {
                return a.reactor.localeCompare(b.reactor)
            },
            width: 80
        },
        //      {
        //     title: 'Experiment type',
        //     dataIndex: 'experiment_type',
        //     key: 'experiment_type',
        //     width: 150
        //     //sorter: (a, b) => { return a.experiment_type.localeCompare(b.experiment_type)},
        // },
        //      {
        //     title: 'Properties',
        //     dataIndex: 'common_properties',
        //     key: 'common_properties',
        //     render: p => <CommonPropertiesList common_properties={p}/>,
        //     width: 150
        // }, {
        //     title: 'Initial species',
        //     dataIndex: 'initial_species',
        //     key: 'initial_species',
        //     render: p => <InitialSpeciesList initial_species={p}/>,
        //     width: 80
        // },
         ];


        const experiments = this.props.experiments;
        const chemModelList = this.props.chemModelsList;

        // const tab =             <Table  columns={columns} dataSource={this.props.experiments} rowKey="id"
        //            pagination={false}
        //            //size="small"
        //            bordered
        //            //scroll={{ x: 1600}}
        //            style={{'width' : '100%'}}
        //
        //            defaultExpandAllRows={true}
        //            expandedRowRender={(experiment) => { return <div key={experiment.id}><CurveMatchingResult experiment={experiment.id} chemModels={chemModelList}/></div>
        //            }}
        //     />

        const results = experiments.map((experiment) => { return <div key={experiment.id}><div>{experiment.id}</div><div>{experiment.fileDOI}</div><CurveMatchingResult experiment={experiment.id} chemModels={chemModelList}/><Divider/></div>});

        return (
            <div>
                {results}
            </div>


        );



    }
}

class SearchMain extends React.Component {
    render() {
        return (
            <Row gutter={16} style={{'width' : '100%'}}>
                <Col span={12}>
                    <SearchAndExecute/>
                </Col>
                <Col span={12}>
                    <ExperimentExecutionsCMList experimentList={[11]} chemModelsList={[1, 2]}/>
                </Col>
            </Row>
        )
    }
}


export {SearchAndExecute, CommonPropertiesList, InitialSpeciesList, SearchMain, CurveMatchingTable, CurveMatchingResult, ExperimentExecutionsCMDetails}