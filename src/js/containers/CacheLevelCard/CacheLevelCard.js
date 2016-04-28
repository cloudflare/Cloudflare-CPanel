import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import { asyncZoneUpdateSetting } from '../../actions/zoneSettings';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import { RadioGroup } from 'cf-component-radio';

const SETTING_NAME = "cache_level";

class CacheLevelCard extends Component {

    handleRadioChange(value) {
        let { activeZoneId, dispatch } = this.props;
        dispatch(asyncZoneUpdateSetting(SETTING_NAME, activeZoneId, value));
    }

    render() {
        const { formatMessage } = this.props.intl;
        return (
            <div>
                <Card>
                    <CardSection>
                        <CardContent  title={formatMessage({id: 'container.cacheLevelCard.title'})}>
                            <p><FormattedMessage id="container.cacheLevelCard.description" /></p>
                        </CardContent>
                        <CardControl>
                            <RadioGroup
                                value={this.props.cacheLevelValue}
                                onChange={this.handleRadioChange.bind(this)}
                                options={[
                            { label: formatMessage({id: 'container.cacheLevelCard.simplified'}), name: 'cache_level_simplified', value: 'simplified' },
                            { label: formatMessage({id: 'container.cacheLevelCard.basic'}), name: 'cache_level_basic', value: 'basic' },
                            { label: formatMessage({id: 'container.cacheLevelCard.aggressive'}), name: 'cache_level_aggressive', value: 'aggressive' }
                          ]}/>
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
        cacheLevelValue: state.zoneSettings.entities[state.activeZone.id][SETTING_NAME].value,
    }
}
export default injectIntl(connect(mapStateToProps)(CacheLevelCard));

