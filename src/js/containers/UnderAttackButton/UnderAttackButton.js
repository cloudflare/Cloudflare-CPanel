import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import { Button } from 'cf-component-button';

import { asyncZoneUpdateSetting } from '../../actions/zoneSettings';

const SETTING_NAME = "security_level";

class UnderAttackButton extends Component {
    state = {
        value: this.props.securityLevelValue
    };

    handleChange(value) {
        let { dispatch } = this.props;
        this.setState({value: value});
        dispatch(asyncZoneUpdateSetting(SETTING_NAME, this.props.activeZoneId, value));
    }

    render() {
        let { value } = this.state;
        let buttonText = (value === "under_attack") ? "container.underAttackButton.turnOn" : "container.underAttackButton.turnOff";
        let buttonValue = (value === "under_attack") ? "essentially_off" : "under_attack";
        let buttonType = (value === "under_attack") ? "warning" : "default";

        return (
            <div>
                <label><FormattedMessage id="container.underAttackButton.description"/></label>
                <Button type={buttonType} onClick={ (e) => this.handleChange(buttonValue) }>
                    <FormattedMessage id={buttonText}/>
                </Button>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeZoneId: state.activeZone.id,
        securityLevelValue: state.zoneSettings.entities[state.activeZone.id][SETTING_NAME].value,
        isFetching: state.zoneSettings.isFetching
    }
}
export default injectIntl(connect(mapStateToProps)(UnderAttackButton));
