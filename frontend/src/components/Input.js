import React, {Component,} from 'react';
import ReactDOM from 'react-dom';
import {
    Form,
    Input,
    InputNumber,
    Icon,
    Button,
    Select,
    Collapse,
    Upload,
    Popover,
    Table,
    Modal,
    Switch,
    Row,
    Col,
    Tag,
    message
} from 'antd';
import './Input.css';
import axios from "axios/index";

import {InitialSpeciesList, CommonPropertiesList} from "./Search"
import {ExperimentDraw} from "./Db"

import Cookies from 'js-cookie';

const Option = Select.Option;
const Panel = Collapse.Panel;

const FormItem = Form.Item;

let props_uuid = 0;
let species_uuid = 0;

const csrftoken = Cookies.get('csrftoken');
axios.defaults.headers.post['X-CSRFToken'] = csrftoken; // for POST requests


console.log(csrftoken);


class GenericTable extends React.Component {

    render() {
        const data = this.props.data;
        const names = this.props.names;

        if (names == null || names.length === 0) {
            return null;
        }

        const columns = names.map(function (name) {
            return {
                title: name,
                key: name,
                dataIndex: name,
                width: 200
            }
        });


        const total_width = (names.length * 200);
        return (
            <div>
                <Table
                    dataSource={data}
                    columns={columns}
                    scroll={{x: total_width}}
                    size='small'
                    pagination={false}
                    bordered
                />
            </div>)

    }
}

class ReviewTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            number_managed: 0,
            experiments: []
        }
    }

    componentDidMount() {
        this.setState({loading: true});
        axios.get('experimentmanager/api/experiments/filter', {
            params: {
                experiments: this.props.exp_ids
            }
        })
            .then(res => {
                const experiments = res.data;
                const experiments_managed = res.data.filter((exp) => exp.run_type_str != null);
                this.setState({experiments: experiments, loading: false, number_managed: experiments_managed.length});
            })
    }

    render() {
        const columns = [{
            title: 'File DOI',
            dataIndex: 'fileDOI',
            key: 'fileDOI',
            sorter: (a, b) => {
                return a.fileDOI.localeCompare(b.fileDOI)
            },

        },
            //     {
            //     title: 'Id',
            //     dataIndex: 'id',
            //     key: 'id',
            // },
            {
                title: 'Paper',
                dataIndex: 'file_paper.title',
                key: 'file_paper.title',
            }, {
                title: 'Reactor',
                dataIndex: 'reactor',
                key: 'reactor',

            }, {
                title: 'Properties',
                dataIndex: 'common_properties',
                key: 'common_properties',
                render: props => <CommonPropertiesList common_properties={props}/>
            }, {
                title: 'Initial species',
                dataIndex: 'initial_species',
                key: 'initial_species',
                render: props => <InitialSpeciesList initial_species={props}/>,
            }, {
                title: 'Detected type',
                dataIndex: 'run_type_str',
                key: 'run_type_str',
                render: type => type === null ? <Tag color="red">No type</Tag> : <Tag color="green">{type}</Tag>

            }];

        return (
            <div>
                <Table columns={columns} dataSource={this.state.experiments} rowKey="id" loading={this.state.loading}
                       bordered
                    //expandedRowRender={record => {return <ExperimentDetail experiment={record}/>}}
                       expandedRowRender={record => {
                           return <ExperimentDraw experiment={record}/>
                       }}
                />
            </div>
        )
    }
}

class CommonPropertiesForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dataPreviewVisible: false,
            dataFilePreview: null,
            previewType: "",
            species_names: [],
            reviewVisible: false,
            reviewExperiments: []
        }
    }


    remove_prop = (k) => {
        const {form} = this.props;
        const keys = form.getFieldValue('props_keys');

        form.setFieldsValue({
            props_keys: keys.filter(key => key !== k),
        });
    };

    add_prop = () => {
        const {form} = this.props;
        const keys = form.getFieldValue('props_keys');
        const nextKeys = keys.concat(props_uuid);
        props_uuid++;
        form.setFieldsValue({
            props_keys: nextKeys,
        });
    };


    remove_specie = (k) => {
        const {form} = this.props;
        const keys = form.getFieldValue('species_keys');

        form.setFieldsValue({
            species_keys: keys.filter(key => key !== k),
        });
    };

    add_specie = () => {
        const {form} = this.props;
        const keys = form.getFieldValue('species_keys');
        const nextKeys = keys.concat(species_uuid);
        species_uuid++;
        form.setFieldsValue({
            species_keys: nextKeys,
        });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);

                axios.post('experimentmanager/input/submit', {
                    params: {"values": values}
                })
                    .then(res => {

                        const response = res.data;
                        const a = response['experiment'];
                        this.setState({reviewVisible: true, reviewExperiments: [a]})
                    }).catch(error => {
                    message.error(error.message + " - " + error.response.message)
                })
            }
        });
    };

    normFile = (e) => {
        console.log('Upload event:', e);

        let fileList = e.fileList;

        // 1. Limit the number of uploaded files
        // Only to show two recent uploaded files, and old ones will be replaced by the new
        fileList = fileList.slice(-1);

        // 2. Read from response and show file link
        fileList = fileList.map((file) => {
            if (file.response) {
                // Component will show file.url as link
                file.url = file.response.url;
            }
            return file;
        });

        // 3. Filter successfully uploaded files according to response from server
        // fileList = fileList.filter((file) => {
        //     if (file.response) {
        //         return file.response.status === 'success';
        //     }
        //     return false;
        // });

        return fileList
    };

    handleDataPreview = (file) => {
        console.log(file)
        this.setState({dataPreviewVisible: true, dataFilePreview: file, previewType: "data"})
        //this.setState({
        //     //  previewImage: file.url || file.thumbUrl,
        //     //  previewVisible: true,
        //     //});
    };

    onFileDataChange = (info) => {

        if (info.file.status === 'done') {
            message.success(`${info.file.name} data file uploaded successfully`);
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} data file upload failed: ${info.file.response}`);
        }
    };

    handleExperimentsCancel = () => {
        // TODO
    };

    handleExperimentsOk = () => {
        this.setState({reviewVisible: false, reviewExperiments: []})

    };


    handleCancel = () => this.setState({dataPreviewVisible: false});

    handleReviewCancel = () => this.setState({reviewVisible: false});


    handlePropertyChanged = (value) => {
        console.log(file)
        this.setState({dataPreviewVisible: true, dataFilePreview: file, previewType: "data"})
        //this.setState({
        //     //  previewImage: file.url || file.thumbUrl,
        //     //  previewVisible: true,
        //     //});
    };

    render() {
        const {getFieldDecorator, getFieldValue} = this.props.form;

        getFieldDecorator('props_keys', {initialValue: []});
        getFieldDecorator('species_keys', {initialValue: []});

        //getFieldDecorator('fileList', {initialValue: []});


        const formItemLayoutWithOutLabel = {
            wrapperCol: {
                sm: {span: 20, offset: 0},
            },
        };

        const formItemLayout = {
            labelCol: {span: 2},
            wrapperCol: {span: 18},
        };

        const props_keys = getFieldValue('props_keys');

        const props_units_mapping = {
            'temperature': ['K'],
            'pressure': ['Pa', 'atm', 'bar', 'Torr', 'mbar'],
            'residence time': ['s', 'ms', 'us'],
            'volume': ['cm3'],
            'laminar burning velocity': ['cm/s']
        };

        const property_names = Object.keys(props_units_mapping);

        const propertiesType = props_keys.map((k, index) => {
            const species_options = property_names.map((property_name) => <Option key={property_name}
                                                                                  value={property_name}>{property_name}</Option>);

            return getFieldDecorator(`property[${k}]['name']`, {
                rules: [{
                    required: true,
                    message: "Please insert property name or delete this field.",
                }],
            })(
                <Select style={{width: 200}}>
                    {species_options}

                </Select>
            );
        });


        const propertiesUnits = props_keys.map((k, index) => {
            const propertyName = getFieldValue('property')[k]['name'];
            let units = [];
            if (propertyName != null) {
                units = props_units_mapping[propertyName]
            }
            const opts = units.map((k) => {
                return (<Option value={k} key={k}>{k}</Option>)
            });

            return getFieldDecorator(`property[${k}]['units']`, {
                initialValue: units.length > 0 ? units[0] : null,
                rules: [{
                    required: true,
                    message: "Please insert property units or delete this field.",
                }],
            })(
                <Select style={{width: 80}}>
                    {opts}
                </Select>);

        });

        const propsFormItems = props_keys.map((k, index) => {
            return (
                <FormItem
                    {...formItemLayoutWithOutLabel}
                    //label={index === 0 ? 'Passengers' : ''}
                    //required={true}
                    key={k}
                >
                    {getFieldDecorator(`property[${k}]['value']`, {
                        validateTrigger: ['onChange', 'onBlur'],
                        rules: [{
                            required: true,
                            message: "Please insert property value or delete this field.",
                        }],
                    })(
                        //<CommonPropertyInput style={{width: '60%', marginRight: 8}}/>
                        //<Input placeholder="passenger name" style={{ width: '60%', marginRight: 8 }} />

                        <Input addonBefore={propertiesType[index]} addonAfter={propertiesUnits[index]}
                               style={{width: '50%'}}/>
                    )}
                    <Icon
                        className="dynamic-delete-button"
                        type="minus-circle-o"

                        onClick={() => this.remove_prop(k)}
                    />
                </FormItem>
            );
        });

        const species_keys = getFieldValue('species_keys');

        const species = this.state.species_names;
        const species_units = ["moles"];
        const species_units_phi = ["fuel moles", "oxidizer moles"];

        const speciesType = species_keys.map((k, index) => {
            const species_options = species.map((specie) => <Option key={specie} value={specie}>{specie}</Option>);
            return getFieldDecorator(`species[${k}]['name']`, {
                rules: [{
                    required: true,
                    message: "Please insert specie's name or delete this field.",
                }],
            })(
                <Select style={{width: 150}}
                        showSearch
                        style={{width: 200}}
                        placeholder={"Select a component"}
                        optionFilterProp="children"
                        filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                    {species_options}
                </Select>
            );
        });

        const enable_phi = getFieldValue("enable_phi");

        const speciesUnits = species_keys.map((k, index) => {
            //const speciesName = getFieldValue('species')[k]['name'];
            //let units = [];
            //if (speciesName != null) {
            //    units = species_units_mapping[speciesName]
            //}
            const su = enable_phi ? species_units_phi : species_units
            const opts = su.map((k) => {
                return (<Option value={k} key={k}>{k}</Option>)
            });

            return getFieldDecorator(`species[${k}]['units']`, {
                initialValue: su[0],
                rules: [{
                    required: true,
                    message: "Please insert specie's name or delete this field.",
                }],
            })(
                <Select style={{width: 150}}>
                    {opts}
                </Select>);

        });

        const speciesFormItems = species_keys.map((k, index) => {
            return (
                <FormItem
                    {...formItemLayoutWithOutLabel}
                    //label={index === 0 ? 'Passengers' : ''}
                    required={true}
                    key={k}
                >
                    {getFieldDecorator(`species[${k}]['amount']`, {
                        validateTrigger: ['onChange', 'onBlur'],
                        rules: [{
                            required: true,
                            message: "Please input specie's value or delete this field.",
                        }],
                    })(
                        //<CommonPropertyInput style={{width: '60%', marginRight: 8}}/>
                        //<Input placeholder="passenger name" style={{ width: '60%', marginRight: 8 }} />

                        <Input addonBefore={speciesType[index]} addonAfter={speciesUnits[index]}
                               style={{width: '50%'}}/>
                    )}
                    <Icon
                        className="dynamic-delete-button"
                        type="minus-circle-o"

                        onClick={() => this.remove_specie(k)}
                    />
                </FormItem>
            );
        });

        // TODO: limit upload size


        const dataUpload = <FormItem
            {...formItemLayoutWithOutLabel}
            extra={<a>Format guide</a>}
        >
            {getFieldDecorator('file_upload', {
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                rules: [{required: true, message: 'Please upload experiment data'},
                    //{
                    //validator: (rule, value, cb) => {cb()},
                    //message: 'Please upload a valid experiment data'
                    //}
                ]
            })(
                <Upload multiple={false} name="data_excel" action='experimentmanager/input/data_excel' accept={".xlsx"}
                        onPreview={this.handleDataPreview}
                        headers={{"X-CSRFToken": csrftoken}}
                        onChange={this.onFileDataChange}>
                    <Button>
                        <Icon type="upload"/> Click to upload
                    </Button>
                </Upload>
            )}
        </FormItem>


        const reactorSelect = <FormItem label={"Reactor"}>
            {getFieldDecorator('reactor', {
                rules: [{required: true, message: 'Please insert a reactor.'}],
            })(
                <Select
                    placeholder="Select a reactor"
                    allowClear={true}
                    style={{width: "15%"}}
                >
                    <Option value="shock tube">Shock tube</Option>
                    <Option value="stirred reactor">Perfectly Stirred Reactor</Option>
                    <Option value="flow reactor">Plug Flow Reactor</Option>
                    <Option value="flame">Flame</Option>
                </Select>
            )}
        </FormItem>


        // const experimentTypeSelect = <FormItem label={"Experiment Type"}>
        //     {getFieldDecorator('reactor', {
        //         //rules: [{required: true, message: 'Please insert a reactor.'}],
        //     })(
        //         <Select
        //             placeholder="Select an experiment type"
        //             allowClear={true}
        //             style={{width: "15%"}}
        //         >
        //             <Option value="Shock tube"></Option>
        //             <Option value="Perfectly Stirred Reactor"></Option>
        //             <Option value="Plug Flow Reactor" disabled></Option>
        //             <Option value="Flame"></Option>
        //         </Select>
        //     )}
        // </FormItem>

        const referenceInput = <FormItem label={"Paper reference"}>
            {
                getFieldDecorator('reference', {
                    rules: [{required: true, message: 'Please insert a paper reference.'}],
                })(
                    <Input.TextArea style={{width: "50%"}}/>
                )
            }
        </FormItem>

        const experimentReferenceInput = <FormItem label={"Experiment reference"}>
            {
                getFieldDecorator('exp_reference', {
                    rules: [{required: true, message: 'Please insert an experiment reference.'}],
                })(
                    <Input.TextArea style={{width: "50%"}}/>
                )
            }
        </FormItem>


        const fileDOIInput = <FormItem label={"Paper DOI"}>
            {
                getFieldDecorator('fileDOI', {
                    rules: [{required: true, message: 'Please insert a paper DOI.'}],
                })(
                    <Input style={{width: "50%"}}/>
                )
            }
        </FormItem>


        const commentsInput = <FormItem label={"Comments"}>
            {
                getFieldDecorator('comments', {
                    //rules: [{required: true, message: 'Please insert a reactor.'}],
                })(
                    <Input.TextArea style={{width: "50%"}}/>
                )
            }
        </FormItem>

        const layout_switch_phi = {
            labelCol: {span: 2},
            wrapperCol: {span: 12},
        }
        const switchPhi = <FormItem
            {...layout_switch_phi}
            label="Fuels/oxidizers"
        >
            {getFieldDecorator('enable_phi', {valuePropName: 'checked', initialValue: false})(
                <Switch/>
            )}
        </FormItem>


        const equivalence_ratio = <FormItem
            {...layout_switch_phi}
            label="Equiv. ratio">
            {getFieldDecorator('phi', {
                rules: [{
                    required: enable_phi,
                    message: "Please insert the equivalence ratio.",
                }],
            })(
                <InputNumber min={0} step={0.1} disabled={!enable_phi}/>
            )}
        </FormItem>


        const guidePopover = <Popover content={"test"} title="Title">
            <Button type="primary">Hover me</Button>
        </Popover>

        let preview = null;
        if (this.state.previewType === "data") {
            const data_file_preview_names = this.state.dataFilePreview == null ? null : this.state.dataFilePreview.response.names;
            const data_file_preview_data = this.state.dataFilePreview == null ? null : this.state.dataFilePreview.response.data;
            preview = <GenericTable names={data_file_preview_names} data={data_file_preview_data}/>;
        }


        return (
            <div>
                <Form onSubmit={this.handleSubmit} layout={"horizontal"}>
                    <Collapse defaultActiveKey={['1', '2', '3', '4', '5', '6']}>
                        <Panel header="General" key="1">
                            {reactorSelect}
                        </Panel>
                        <Panel header="Common properties" key="2">
                            {propsFormItems}
                            <FormItem {...formItemLayoutWithOutLabel}>
                                <Button type="dashed" onClick={this.add_prop} style={{width: '50%'}}>
                                    <Icon type="plus"/> Add property
                                </Button>
                            </FormItem>
                        </Panel>
                        <Panel header="Input species" key="3">
                            {switchPhi}
                            {equivalence_ratio}
                            {speciesFormItems}
                            <FormItem {...formItemLayoutWithOutLabel}>
                                <Button type="dashed" onClick={this.add_specie} style={{width: '50%'}}>
                                    <Icon type="plus"/> Add species
                                </Button>
                            </FormItem>
                        </Panel>
                        <Panel header="Experimental data" key="4">
                            {dataUpload}

                        </Panel>


                        <Panel header="Bibliography data" key="5">
                            {referenceInput}
                            {experimentReferenceInput}
                            {fileDOIInput}
                        </Panel>

                        <Panel header="Additional" key="6">
                            {commentsInput}
                        </Panel>
                    </Collapse>
                    <FormItem {...formItemLayoutWithOutLabel}>
                        <Button type="primary" htmlType="submit">Submit</Button>
                    </FormItem>
                </Form>
                <Modal visible={this.state.dataPreviewVisible} footer={null} width={800} onCancel={this.handleCancel}>
                    {preview}
                </Modal>
                <Modal visible={this.state.reviewVisible} width={1000} onCancel={this.handleReviewCancel}
                       footer={[
                           <Button key="back" onClick={this.handleExperimentsCancel}>Cancel</Button>,
                           <Button key="submit" type="primary" onClick={this.handleExperimentsOk}>
                               Submit
                           </Button>,
                       ]}>
                    <ReviewTable exp_ids={this.state.reviewExperiments} key={this.state.reviewExperiments.toString()}/>
                </Modal>
            </div>

        );
    }

    componentDidMount() {

        axios.get('experimentmanager/api/opensmoke/species_names', {
            params: {}
        })
            .then(res => {
                const response = res.data;
                this.setState({species_names: response['names']});
            })
    }

}


class DataForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dataPreviewVisible: false,
            dataFilePreview: null,
            previewType: "",
            species_names: [],
            reviewVisible: false,
            reviewExperiments: []
        }
    }


    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);

                axios.post('experimentmanager/input/submit', {
                    params: {"values": values}
                })
                    .then(res => {

                        const response = res.data;
                        const a = response['experiment'];
                        this.setState({reviewVisible: true, reviewExperiments: [a]})
                    })
            }
        });
    };
    onFileDataChange = (info) => {

        if (info.file.status === 'done') {
            message.success(`${info.file.name} data file uploaded successfully`);
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} data file upload failed.`);
        }
    };

    onInputDataChange = (info) => {

        if (info.file.status === 'done') {
            message.success(`${info.file.name} input file uploaded successfully`);
        } else if (info.file.status === 'error') {
            console.log(info)
            message.error(`${info.file.name} input file upload failed: ${info.file.response}`);
        }
    };


    normFile = (e) => {
        console.log('Upload event:', e);

        let fileList = e.fileList;

        // 1. Limit the number of uploaded files
        // Only to show two recent uploaded files, and old ones will be replaced by the new
        fileList = fileList.slice(-1);

        // 2. Read from response and show file link
        fileList = fileList.map((file) => {
            if (file.response) {
                // Component will show file.url as link
                file.url = file.response.url;
            }
            return file;
        });

        // 3. Filter successfully uploaded files according to response from server
        // fileList = fileList.filter((file) => {
        //     if (file.response) {
        //         return file.response.status === 'success';
        //     }
        //     return false;
        // });

        return fileList
    };

    handleDataPreview = (file) => {
        console.log(file)
        this.setState({dataPreviewVisible: true, dataFilePreview: file, previewType: "data"})
        //this.setState({
        //     //  previewImage: file.url || file.thumbUrl,
        //     //  previewVisible: true,
        //     //});
    };

    handleInputPreview = (file) => {
        console.log(file)
        this.setState({dataPreviewVisible: true, dataFilePreview: file, previewType: "input"})
        //this.setState({
        //     //  previewImage: file.url || file.thumbUrl,
        //     //  previewVisible: true,
        //     //});
    };

    handleExperimentsCancel = () => {

    };

    handleExperimentsOk = () => {
        this.setState({reviewVisible: false, reviewExperiments: []})

    };


    handleCancel = () => this.setState({dataPreviewVisible: false});

    handleReviewCancel = () => this.setState({reviewVisible: false});

    handleFileDataChange = (info) => {

    };


    render() {
        const {getFieldDecorator, getFieldValue} = this.props.form;

        const formItemLayoutWithOutLabel = {
            wrapperCol: {
                sm: {span: 20, offset: 0},
            },
        };

        const formItemLayout = {
            labelCol: {span: 2},
            wrapperCol: {span: 18},
        };


        // TODO: limit upload size

        const dataUpload = <FormItem
            {...formItemLayoutWithOutLabel}
            extra={<a>Format guide</a>}
        >
            {getFieldDecorator('file_upload', {
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                rules: [{required: true, message: 'Please upload experiment data'}]
            })(
                <Upload multiple={false} name="data_excel" action='experimentmanager/input/data_excel' accept={".xlsx"}
                        onPreview={this.handleDataPreview}
                        headers={{"X-CSRFToken": csrftoken}}
                        onChange={this.onFileDataChange}>
                    <Button>
                        <Icon type="upload"/> Click to upload
                    </Button>
                </Upload>
            )}
        </FormItem>


        const inputFileUpload = <FormItem
            {...formItemLayoutWithOutLabel}
            extra={<a>Format guide</a>}
        >
            {getFieldDecorator('input_upload', {
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                rules: [{required: true, message: 'Please upload an input file'}]
            })(
                <Upload multiple={false} name="input_dic" action='experimentmanager/input/input_file' accept={".dic"}
                        onPreview={this.handleInputPreview}
                        headers={{"X-CSRFToken": csrftoken}}
                        onChange={this.onInputDataChange}>
                    <Button>
                        <Icon type="upload"/> Click to upload
                    </Button>
                </Upload>
            )}
        </FormItem>


        const reactorSelect = <FormItem label={"Reactor"}>
            {getFieldDecorator('reactor', {
                rules: [{required: true, message: 'Please insert a reactor.'}],
            })(
                <Select
                    placeholder="Select a reactor"
                    allowClear={true}
                    style={{width: "15%"}}
                >
                    <Option value="shock tube">Shock tube</Option>
                    <Option value="stirred reactor">Perfectly Stirred Reactor</Option>
                    <Option value="flow reactor">Plug Flow Reactor</Option>
                    <Option value="flame">Flame</Option>
                </Select>
            )}
        </FormItem>


        const referenceInput = <FormItem label={"Paper reference"}>
            {
                getFieldDecorator('reference', {
                    rules: [{required: true, message: 'Please insert a paper reference.'}],
                })(
                    <Input.TextArea style={{width: "50%"}}/>
                )
            }
        </FormItem>

        const experimentReferenceInput = <FormItem label={"Experiment reference"}>
            {
                getFieldDecorator('exp_reference', {
                    rules: [{required: true, message: 'Please insert an experiment reference.'}],
                })(
                    <Input.TextArea style={{width: "50%"}}/>
                )
            }
        </FormItem>


        const fileDOIInput = <FormItem label={"Paper DOI"}>
            {
                getFieldDecorator('fileDOI', {
                    rules: [{required: true, message: 'Please insert a paper DOI.'}],
                })(
                    <Input style={{width: "50%"}}/>
                )
            }
        </FormItem>


        const commentsInput = <FormItem label={"Comments"}>
            {
                getFieldDecorator('comments', {
                    //rules: [{required: true, message: 'Please insert a reactor.'}],
                })(
                    <Input.TextArea style={{width: "50%"}}/>
                )
            }
        </FormItem>


        const guidePopover = <Popover content={"test"} title="Title">
            <Button type="primary">Hover me</Button>
        </Popover>


        let preview = null;
        if (this.state.previewType === "data") {
            const data_file_preview_names = this.state.dataFilePreview == null ? null : this.state.dataFilePreview.response.names;
            const data_file_preview_data = this.state.dataFilePreview == null ? null : this.state.dataFilePreview.response.data;
            preview = <GenericTable names={data_file_preview_names} data={data_file_preview_data}/>;
        } else if (this.state.previewType === "input") {
            preview = <div>
                <pre>{this.state.dataFilePreview.response.data}</pre>
            </div>
        }


        return (
            <div>
                <Form onSubmit={this.handleSubmit} layout={"horizontal"}>
                    <Collapse defaultActiveKey={['1', '2', '3', '4', '5']}>
                        <Panel header="General" key="1">
                            {reactorSelect}
                        </Panel>

                        <Panel header="Experimental data" key="2">
                            {dataUpload}

                        </Panel>

                        <Panel header="Experimental setting (input file)" key="3">
                            {inputFileUpload}

                        </Panel>

                        <Panel header="Bibliography data" key="4">
                            {referenceInput}
                            {experimentReferenceInput}
                            {fileDOIInput}
                        </Panel>

                        <Panel header="Additional" key="5">
                            {commentsInput}
                        </Panel>
                    </Collapse>
                    <FormItem {...formItemLayoutWithOutLabel}>
                        <Button type="primary" htmlType="submit">Submit</Button>
                    </FormItem>
                </Form>
                <Modal visible={this.state.dataPreviewVisible} footer={null} width={800} onCancel={this.handleCancel}>
                    {preview}
                </Modal>
                <Modal visible={this.state.reviewVisible} width={1000} onCancel={this.handleReviewCancel}
                       footer={[
                           <Button key="back" onClick={this.handleExperimentsCancel}>Cancel</Button>,
                           <Button key="submit" type="primary" onClick={this.handleExperimentsOk}>
                               Submit
                           </Button>,
                       ]}>
                    <ReviewTable exp_ids={this.state.reviewExperiments}/>
                </Modal>
            </div>

        );
    }

    componentDidMount() {

    }

}


const WrappedCommonPropertiesForm = Form.create()(CommonPropertiesForm);
const WrappedDataForm = Form.create()(DataForm);

export {WrappedCommonPropertiesForm, WrappedDataForm}