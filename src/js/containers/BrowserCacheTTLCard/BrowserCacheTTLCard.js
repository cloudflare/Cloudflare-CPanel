import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import { asyncZoneUpdateSetting } from '../../actions/zoneSettings';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import Select from 'cf-component-select';

const SETTING_NAME = "browser_cache_ttl";

class BrowserCacheTTLCard extends Component {

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
                        <CardContent  title={formatMessage({id: 'container.browserCacheTTLCard.title'})}>
                            <p><FormattedMessage id="container.browserCacheTTLCard.description" /></p>
                        </CardContent>
                        <CardControl>
                            <Select label=""
                                    value={ this.props.browserCacheTTLValue }
                                    options={[
                                    {value: 7200, label: formatMessage({id: 'container.browserIntegrityCheckCard.twoHours'})},
                                    {value: 10800, label: formatMessage({id: 'container.browserIntegrityCheckCard.threeHours'})},
                                    {value: 14400, label: formatMessage({id: 'container.browserIntegrityCheckCard.fourHours'})},
                                    {value: 18000, label: formatMessage({id: 'container.browserIntegrityCheckCard.fiveHours'})},
                                    {value: 28800, label: formatMessage({id: 'container.browserIntegrityCheckCard.eightHours'})},
                                    {value: 43200, label: formatMessage({id: 'container.browserIntegrityCheckCard.twelveHours'})},
                                    {value: 57600, label: formatMessage({id: 'container.browserIntegrityCheckCard.sixteenHours'})},
                                    {value: 72000, label: formatMessage({id: 'container.browserIntegrityCheckCard.twentyHours'})},
                                    {value: 86400, label: formatMessage({id: 'container.browserIntegrityCheckCard.oneDay' })},
                                    {value: 172800, label: formatMessage({id: 'container.browserIntegrityCheckCard.twoDays'})},
                                    {value: 259200, label: formatMessage({id: 'container.browserIntegrityCheckCard.threeDays'})},
                                    {value: 345600, label: formatMessage({id: 'container.browserIntegrityCheckCard.fourDays'})},
                                    {value: 432000, label: formatMessage({id: 'container.browserIntegrityCheckCard.fiveDays'})},
                                    {value: 691200, label: formatMessage({id: 'container.browserIntegrityCheckCard.eightDays'})},
                                    {value: 1382400, label: formatMessage({id: 'container.browserIntegrityCheckCard.sixteenDays'})},
                                    {value: 2073600, label: formatMessage({id: 'container.browserIntegrityCheckCard.twentyFourDays'})},
                                    {value: 2592000, label: formatMessage({id: 'container.browserIntegrityCheckCard.oneMonth'})},
                                    {value: 5184000, label: formatMessage({id: 'container.browserIntegrityCheckCard.twoMonths'})},
                                    {value: 15552000, label: formatMessage({id: 'container.browserIntegrityCheckCard.sixMonths'})},
                                    {value: 31536000, label: formatMessage({id: 'container.browserIntegrityCheckCard.oneYear'})}
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
        browserCacheTTLValue: state.zoneSettings.entities[state.activeZone.id][SETTING_NAME].value,
        isFetching: state.zoneSettings.isFetching
    }
}
export default injectIntl(connect(mapStateToProps)(BrowserCacheTTLCard));
