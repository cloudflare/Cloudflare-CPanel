import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import { asyncZoneUpdateSetting } from '../../actions/zoneSettings';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import Select from 'cf-component-select';

const SETTING_NAME = "security_level";

class SecurityLevelCard extends Component {

    handleChange(value) {
        let { dispatch } = this.props;
        dispatch(asyncZoneUpdateSetting(SETTING_NAME, this.props.activeZoneId, value));
    }

    render() {
        const { formatMessage } = this.props.intl;
        return (
            <div>
                <Card>
                    <CardSection>
                        <CardContent  title={formatMessage({id: 'container.securityLevelCard.title'})}>
                            <p><FormattedMessage id="container.securityLevelCard.description" /></p>
                        </CardContent>
                        <CardControl>
                            <Select label=""
                                    value={ this.props.securityLevelValue }
                                    options={[
                                        {value: 'essentially_off', label: formatMessage({id: 'container.securityLevelCard.select.essentiallyOff'})},
                                        {value: 'low', label: formatMessage({id: 'container.securityLevelCard.select.low'})},
                                        {value: 'medium', label: formatMessage({id: 'container.securityLevelCard.select.medium'})},
                                        {value: 'high', label: formatMessage({id: 'container.securityLevelCard.select.high'})},
                                        {value: 'under_attack', label: formatMessage({id: 'container.securityLevelCard.select.underAttack'})}
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
        securityLevelValue: state.zoneSettings.entities[state.activeZone.id].security_level.value,
    }
}
export default injectIntl(connect(mapStateToProps)(SecurityLevelCard));
