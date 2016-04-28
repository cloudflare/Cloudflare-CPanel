import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { asyncZoneUpdateSetting } from '../../actions/zoneSettings';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import Toggle from 'cf-component-toggle';

const SETTING_NAME = "browser_check";

class BrowserIntegrityCheckCard extends Component {

    handleChange(value) {
        let { activeZoneId, dispatch } = this.props;
        value = (value === true ? "on" : "off");
        dispatch(asyncZoneUpdateSetting(SETTING_NAME, activeZoneId, value));
    }

    render() {
        const { formatMessage } = this.props.intl;
        return (
            <div>
                <Card>
                    <CardSection>
                        <CardContent  title={formatMessage({id: 'container.browserIntegrityCheckCard.title'})}>
                            <p><FormattedMessage id="container.browserIntegrityCheckCard.description" /></p>
                        </CardContent>
                        <CardControl>
                                <Toggle
                                    label=""
                                    value={(this.props.browserIntegrityCheckValue === "on")}
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
        browserIntegrityCheckValue: state.zoneSettings.entities[state.activeZone.id].browser_check.value,
    }
}
export default injectIntl(connect(mapStateToProps)(BrowserIntegrityCheckCard));
