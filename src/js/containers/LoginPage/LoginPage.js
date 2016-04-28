import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router';
import { routeActions } from 'redux-simple-router'

import MarketingFeature from '../../components/MarketingFeature/MarketingFeature';
import * as UserActionCreators from '../../actions/user'
import { SIGN_UP_PAGE, DOMAINS_OVERVIEW_PAGE } from '../../constants/UrlPaths.js'
import { isLoggedIn } from '../../utils/Auth/Auth';

class LoginPage extends Component {

    componentWillMount() {
        let { dispatch } = this.props;
        if(isLoggedIn()) {
            dispatch(routeActions.push(DOMAINS_OVERVIEW_PAGE));
        }
    }

    render() {
        const { formatMessage } = this.props.intl;

        return (
            <div>
                <section className="center login-form">
                    <div className="login-container">
                        <form className="form" onSubmit={(e) => this.handleLoginSubmit(e)}>
                            <legend>
                                <h3 className="form-title">
                                    <FormattedMessage id="component.login.form.title" />
                                </h3>
                            </legend>
                            <fieldset>
                            <div className="control-group">
                                <div className="control-label">
                                    <label className="assistive-text">
                                        <FormattedMessage id="component.login.form.email" />
                                    </label>
                                </div>
                                <div className="controls">
                                    <input ref="email" type="text" placeholder={formatMessage({id: "component.login.form.email"})} className="width-full"/>
                                </div>
                            </div>
                            <div className="control-group">
                                <div className="control-label">
                                    <label className="assistive-text">
                                        <FormattedMessage id="component.login.form.password" />
                                    </label>
                                </div>
                                <div className="controls">
                                    <input ref="password" type="password" placeholder={formatMessage({id: "component.login.form.password"})} className="width-full"/>
                                </div>
                            </div>
                            <div className="control-group">
                                <div className="controls">
                                    <button type="submit" className="btn btn-success btn-large width-full">
                                        <FormattedMessage id="component.login.form.button" />
                                    </button>
                                </div>
                            </div>
                            <div className="control-group">
                                <div className="row">
                                    <Link className="pull-left" to={ SIGN_UP_PAGE }><FormattedMessage id="component.login.form.signUp" /></Link>
                                    <a className="pull-right" href="https://cloudflare.com/a/forgot-password" target="_blank"><FormattedMessage id="component.login.form.forgotPassword" /></a>
                                </div>
                            </div>
                            </fieldset>
                        </form>
                    </div>
                </section>
                <div className="row">
                    <div className="col-16">
                        <p style={{'textAlign': 'center', 'marginBottom': '2.5rem'}}><FormattedMessage id="component.login.cloudflare.description"/></p>
                    </div>
                </div>
                <div className="row">
                    <div className="col-4">
                         <MarketingFeature imgSrc="assets/icon-pin.svg" titleKey="component.marketingFeature.cdn.title" descriptionKey="component.marketingFeature.cdn.description" />
                    </div>
                    <div className="col-4">
                        <MarketingFeature imgSrc="assets/icon-bolt.svg" titleKey="component.marketingFeature.optimization.title" descriptionKey="component.marketingFeature.optimization.description" />
                    </div>
                    <div className="col-4">
                        <MarketingFeature imgSrc="assets/icon-shield.svg" titleKey="component.marketingFeature.security.title" descriptionKey="component.marketingFeature.security.description" />
                    </div>
                    <div className="col-4">
                        <MarketingFeature imgSrc="assets/icon-lock.svg" titleKey="component.marketingFeature.ddos.title" descriptionKey="component.marketingFeature.ddos.description" />
                    </div>
                </div>
            </div>
        );
    }

    handleLoginSubmit(e) {
        e.preventDefault();

        const { dispatch } = this.props;
        let email = this.refs.email.value;
        let password = this.refs.password.value;

        dispatch(UserActionCreators.asyncLogin(email,password));
    }

    handleLogout(e) {
        let { dispatch } = this.props;
        dispatch(UserActionCreators.logout());
    }
}

function mapStateToProps(state) {
    return { state: state }
}

export default injectIntl(connect(mapStateToProps)(LoginPage));