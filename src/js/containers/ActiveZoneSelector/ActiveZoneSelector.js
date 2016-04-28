import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, IntlProvider } from 'react-intl';
import _ from 'lodash';

import Select from 'cf-component-select';
import { asyncZoneSetActiveZone } from '../../actions/activeZone';

class ActiveZoneSelector extends Component {

    handleChange(zoneName) {
        let { dispatch, zoneList } = this.props;

        _.values(zoneList).forEach(zone => {
            if(zone.name === zoneName) {
                dispatch(asyncZoneSetActiveZone(zone));
            }
        });
    }

    render() {
        let { activeZone, intl, zoneList } = this.props;
        let zones = _.values(zoneList).map(zone => {
            return { value: zone.name, label: zone.name };
        });

        return (
            <div>
                <Select
                    label={ intl.formatMessage({ id: "container.activeZoneSelector.activeZone" }) }
                    value={ activeZone.name }
                    options={ zones }
                    onChange={ this.handleChange.bind(this) } />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeZone: state.activeZone,
        zoneList: state.zones.entities.zones
    }
}

export default injectIntl(connect(mapStateToProps)(ActiveZoneSelector));