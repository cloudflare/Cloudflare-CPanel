import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import { Button } from 'cf-component-button';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter, ModalActions } from 'cf-component-modal';

import { asyncZonePurgeCache } from '../../actions/zonePurgeCache';

class PurgeCacheCard extends Component {
    state = {
        isModalOpen: false
    };

    handlePurgeCache() {
        this.handleRequestClose();
        let { activeZoneId, dispatch } = this.props;
        dispatch(asyncZonePurgeCache(activeZoneId));
    }

    handleRequestOpen() {
        this.setState({ isModalOpen: true });
    }

    handleRequestClose() {
        this.setState({ isModalOpen: false });
    }

    render() {
        const { formatMessage } = this.props.intl;

        return (
            <div>
                <Card>
                    <CardSection>
                        <CardContent  title={formatMessage({id: 'container.purgeCacheCard.title'})}>
                            <p><FormattedMessage id="container.purgeCacheCard.description" /></p>
                        </CardContent>
                        <CardControl>
                            <Button type="warning" onClick={ this.handleRequestOpen.bind(this) }>
                                <FormattedMessage id="container.purgeCacheCard.button"/>
                            </Button>
                            <Modal
                                isOpen={this.state.isModalOpen}
                                onRequestClose={this.handleRequestClose.bind(this)}>
                                <ModalHeader>
                                    <ModalTitle><FormattedMessage id="container.purgeCacheCard.modal.title"/></ModalTitle>
                                    <ModalClose onClick={this.handleRequestClose.bind(this)}/>
                                </ModalHeader>
                                <ModalBody>
                                    <p><FormattedMessage id="container.purgeCacheCard.modal.description"/></p>
                                </ModalBody>
                                <ModalFooter>
                                    <ModalActions>
                                        <Button type="warning" onClick={ this.handlePurgeCache.bind(this) }>
                                            <FormattedMessage id="container.purgeCacheCard.button"/>
                                        </Button>
                                        <Button onClick={this.handleRequestClose.bind(this)}>
                                            <FormattedMessage id="container.purgeCacheCard.modal.buttonCancel"/>
                                        </Button>
                                    </ModalActions>
                                </ModalFooter>
                            </Modal>
                        </CardControl>
                    </CardSection>
                </Card>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeZoneId: state.activeZone.id,
    }
}
export default injectIntl(connect(mapStateToProps)(PurgeCacheCard));

