import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import _ from 'lodash';

import { Heading } from 'cf-component-heading';

import BrowserIntegrityCheckCard from '../../containers/BrowserIntegrityCheckCard/BrowserIntegrityCheckCard';
import ChallengePassageCard from '../../containers/ChallengePassageCard/ChallengePassageCard';
import FeatureManager from '../../components/FeatureManager/FeatureManager';
import ScanCard from '../../containers/ScanCard/ScanCard';
import SecurityLevelCard from '../../containers/SecurityLevelCard/SecurityLevelCard';
import SSLCard from '../../containers/SSLCard/SSLCard';

class SecurityPage extends Component {

    render() {
        let { activeZoneId, zoneScan, zoneSettings } = this.props;
        let isSettingsEmpty = _.isEmpty(zoneSettings.entities[activeZoneId]);
        let isScanEmpty = _.isEmpty(zoneScan.entities[activeZoneId]);

        return (
            <div>
                {(isSettingsEmpty || isScanEmpty) && (<FormattedMessage id="errors.noActiveZoneSelected"/>)}
                {(!isSettingsEmpty && !isScanEmpty) && (
                    <div>
                        <Heading size={1}><FormattedMessage id="container.securityPage.title"/></Heading>
                        <FeatureManager isEnabled={this.props.config.featureManagerIsSSLEnabled}>
                            <SSLCard/>
                        </FeatureManager>

                        <FeatureManager isEnabled={this.props.config.featureManagerIsSecurityLevelEnabled}>
                            <SecurityLevelCard/>
                        </FeatureManager>

                        <FeatureManager isEnabled={this.props.config.featureManagerIsChallengePassageEnabled}>
                            <ChallengePassageCard/>
                        </FeatureManager>

                        <FeatureManager isEnabled={this.props.config.featureManagerIsBrowserIntegrityCheckEnabled}>
                            <BrowserIntegrityCheckCard/>
                        </FeatureManager>

                        <FeatureManager isEnabled={this.props.config.featureManagerIsScanEnabled}>
                            <ScanCard/>
                        </FeatureManager>
                    </div>
                )}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeZoneId: state.activeZone.id,
        config: state.config.config,
        zoneSettings: state.zoneSettings,
        zoneScan: state.zoneScan
    }
}
export default injectIntl(connect(mapStateToProps)(SecurityPage));