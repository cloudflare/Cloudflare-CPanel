import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { asyncZoneUpdateScan } from '../../actions/zoneScan';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import Toggle from 'cf-component-toggle';

class ScanCard extends Component {

    handleChange(value) {
        let { activeZoneId, dispatch } = this.props;
        dispatch(asyncZoneUpdateScan(activeZoneId, value));
    }

    render() {
        const { formatMessage } = this.props.intl;
        return (
            <div>
                <Card>
                    <CardSection>
                        <CardContent  title={formatMessage({id: 'container.scanCard.title'})}>
                            <p><FormattedMessage id="container.scanCard.description" /></p>
                        </CardContent>
                        <CardControl>
                            <Toggle
                                label=""
                                value={this.props.showInterstitialValue}
                                onChange={this.handleChange.bind(this)}/>
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
        showInterstitialValue: state.zoneScan.entities[state.activeZone.id].show_interstitial,
        isFetching: state.zoneScan.isFetching
    }
}
export default injectIntl(connect(mapStateToProps)(ScanCard));
