import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, IntlProvider } from 'react-intl';
import { GatewayDest, GatewayProvider } from 'react-gateway';

import { LayoutContainer, LayoutRow, LayoutColumn} from 'cf-component-layout';

import ActiveZoneSelector from '../../containers/ActiveZoneSelector/ActiveZoneSelector';
import AppNavigation from '../../containers/AppNavigation/AppNavigation';
import { isLoggedIn } from '../../utils/Auth/Auth';
import { asyncConfigFetch } from '../../actions/config';
import NotificationList from '../../containers/NotificationList/NotificationList';
import UnderAttackButton from '../../containers/UnderAttackButton/UnderAttackButton';

//Safari Intl Polyfill
if (!global.Intl) {
    require('intl');
}
class AppContainer extends Component {


    render() {
        return (
            <div className="wrapper">
                <div className="row">
                    <div className="col-5">
                        &nbsp;
                    </div>
                    <div className="col-6">
                        <img src="./assets/logo.svg" />
                    </div>
                    <div className="col-5">
                        &nbsp;
                    </div>
                </div>
                <div className="row">
                    <div className="col-5">
                        { isLoggedIn() ? <ActiveZoneSelector/> : <noscript/> }
                    </div>
                    <div className="col-6">
                        &nbsp;
                    </div>
                    <div className="col-5">
                        { (isLoggedIn() && this.props.state.zoneSettings.entities[this.props.state.activeZone.id]) ? <UnderAttackButton/> : <noscript/> }
                    </div>
                </div>
                <div className="row">
                    <div className="col-16">
                        <div className="apps-nav secondary-nav" id="zone-nav">
                            <div role="navigation" className="wrapper" id="zone-nav-container">
                                <AppNavigation dispatch={this.props.dispatch} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-16">
                        {this.props.children}
                    </div>
                </div>
                <div className="row">
                    <div className="col-16">
                        <p style={{'textAlign': 'center'}}><FormattedMessage id="container.App.version" values={{'version': this.props.state.config.config.version }}/></p>
                    </div>
                </div>
                <GatewayDest name="modal"/>
                <NotificationList {...this.props} />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return { state: state }
}

// <IntlProvider> must be instantiated before injectIntl() is used so we wrap AppContainer in AppWrapper
const App = injectIntl(connect(mapStateToProps)(AppContainer));

class AppWrapper extends React.Component {
    componentWillMount() {
        let { dispatch } = this.props;
        dispatch(asyncConfigFetch());
    }

    render() {
        if (this.props.state.app.isInitialized) {
            return (
                <IntlProvider locale={this.props.state.intl.locale} messages={this.props.state.intl.translations}>
                    <GatewayProvider>
                        <App>{this.props.children}</App>
                    </GatewayProvider>
                </IntlProvider>
            );
        } else {
            return <noscript/>;
        }
    }
}

export default connect(mapStateToProps)(AppWrapper);