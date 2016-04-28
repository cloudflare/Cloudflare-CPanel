import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import _ from 'lodash';

import { Button } from 'cf-component-button';
import { LayoutRow, LayoutColumn} from 'cf-component-layout';
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter, ModalActions } from 'cf-component-modal';

import { asyncZoneDelete } from '../../actions/zones';
import { asyncZoneProvisionCname, asyncZoneProvisionFull } from '../../actions/zoneProvision';
import FeatureManager from '../../components/FeatureManager/FeatureManager';
import Loading from '../../components/Loading/Loading';
import { zoneSchema } from '../../constants/Schemas';

class ZoneProvisionContainer extends Component {
    state = {
        isModalOpen: false
    };

    isFetching() {
        let { zoneDeleteIsFetching, zoneProvisionCnameIsFetching, zoneProvisionFullIsFetching } = this.props;
        return (zoneDeleteIsFetching || zoneProvisionCnameIsFetching || zoneProvisionFullIsFetching);
    }

    handleFullZoneProvisioningButtonClick() {
        let { dispatch, zone } = this.props;
        dispatch(asyncZoneProvisionFull(zone.name));;
    }

    handleProvisionCNAMEZone() {
        let { dispatch, zone } = this.props;
        dispatch(asyncZoneProvisionCname(zone.name));
    }

    handleDeprovisionZone() {
        this.handleRequestClose();
        let { dispatch, zone } = this.props;
        dispatch(asyncZoneDelete(zone.id));
    }

    handleRequestOpen() {
        this.setState({ isModalOpen: true });
    }

    handleRequestClose() {
        this.setState({ isModalOpen: false });
    }

    render() {


        let { zone } = this.props;
        let isProvisioned = (zone.status === 'active' || zone.status === 'pending');
        let isAnyButtonFetching = this.isFetching();

        return (
            <div>
                {!isAnyButtonFetching ? (
                    isProvisioned ? (
                        <div className="row">
                            <div className="col-16">
                                <Button type="warning" onClick={ this.handleRequestOpen.bind(this) }>
                                    <FormattedMessage id="container.zoneProvision.button.deprovision" />
                                </Button>
                            </div>
                        </div>
                        ) : (
                        <div>
                            <div className="row">
                                <div className="col-16">
                                    <a href="https://support.cloudflare.com/hc/en-us/articles/203685674-Full-setup-versus-Partial-CNAME-setup" target="_blank">
                                        <FormattedMessage id="container.zoneProvision.provisionDifference"/>
                                    </a>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-8">
                                    <Button type="success" onClick={ (e) => this.handleProvisionCNAMEZone() }>
                                        <FormattedMessage id="container.zoneProvision.button.cname"/>
                                    </Button>
                                </div>
                                <div className="col-8">
                                    <FeatureManager isEnabled={this.props.config.featureManagerIsFullZoneProvisioningEnabled}>
                                        <Button type="success" onClick={ (e) => this.handleFullZoneProvisioningButtonClick() }>
                                            <FormattedMessage id="container.zoneProvision.button.full"/>
                                        </Button>
                                    </FeatureManager>
                                </div>
                            </div>
                        </div>
                    )
                ) :
                    (<Loading/>)
                }
                <Modal
                    isOpen={this.state.isModalOpen}
                    onRequestClose={this.handleRequestClose.bind(this)}>
                    <ModalHeader>
                        <ModalTitle><FormattedMessage id="container.zoneProvision.modal.title"/></ModalTitle>
                        <ModalClose onClick={this.handleRequestClose.bind(this)}/>
                    </ModalHeader>
                    <ModalBody>
                        <p><FormattedMessage id="container.zoneProvision.modal.description" values={{ 'zoneName': this.props.activeZoneName }} /></p>
                    </ModalBody>
                    <ModalFooter>
                        <ModalActions>
                            <Button type="warning" onClick={ this.handleDeprovisionZone.bind(this) }>
                                <FormattedMessage id="container.zoneProvision.button.deprovision"/>
                            </Button>
                            <Button onClick={this.handleRequestClose.bind(this)}>
                                <FormattedMessage id="container.zoneProvision.modal.buttonCancel"/>
                            </Button>
                        </ModalActions>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeZoneName: state.activeZone.name,
        config: state.config.config,
        zone: state.zones.entities.zones[state.activeZone.name],
        zoneDeleteIsFetching: state.zones.zoneDeleteIsFetching,
        zoneProvisionCnameIsFetching: state.zones.zoneProvisionCnameIsFetching,
        zoneProvisionFullIsFetching: state.zones.zoneProvisionFullIsFetching,
    }
}

export default injectIntl(connect(mapStateToProps)(ZoneProvisionContainer));