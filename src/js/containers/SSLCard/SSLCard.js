import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import { asyncZoneUpdateSetting } from '../../actions/zoneSettings';
import FeatureManager from '../../components/FeatureManager/FeatureManager';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import Select from 'cf-component-select';

class SSLCard extends Component {

    handleChange(value) {
        let { dispatch } = this.props;
        dispatch(asyncZoneUpdateSetting('ssl', this.props.activeZoneId, value));
    }

    render() {
        const { formatMessage } = this.props.intl;
        return (
            <div>
                <Card>
                    <CardSection>
                        <CardContent  title={formatMessage({id: 'container.sslCard.title'})}>
                            <p><FormattedMessage id="container.sslCard.description" /></p>
                        </CardContent>
                        <CardControl>
                            <Select label=""
                                    value={this.props.sslValue}
                                    options={[
                                        {value: 'off', label: formatMessage({id: 'container.sslCard.select.off'})},
                                        {value: 'flexible', label: formatMessage({id: 'container.sslCard.select.flexible'})},
                                        {value: 'full', label: formatMessage({id: 'container.sslCard.select.full'})},
                                        {value: 'full_strict', label: formatMessage({id: 'container.sslCard.select.full_strict'})}
                                    ]}
                                    onChange={this.handleChange.bind(this)} />
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
        sslValue: state.zoneSettings.entities[state.activeZone.id].ssl.value
    }
}
export default injectIntl(connect(mapStateToProps)(SSLCard));

