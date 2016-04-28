import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import _ from 'lodash';

import * as UserActionCreators from '../../actions/user'
import { notificationAddError } from '../../actions/notifications';
import { TERMS_AND_CONDITIONS_PAGE, PRIVACY_POLICY_PAGE } from '../../constants/UrlPaths';

class SignUpPage extends Component {
    render() {
        let { formatMessage } = this.props.intl;

        return (
            <section className="center login-form">
                <div className="login-container">
                    <form className="form" onSubmit={(e) => this.handleSignUpSubmit(e)}>
                        <legend>
                            <h3 className="form-title">
                                <FormattedMessage id="container.signup.form.title" />
                            </h3>
                        </legend>
                        <fieldset>
                            <div className="control-group">
                                <div className="control-label">
                                    <label className="assistive-text">
                                        <FormattedMessage id="container.signup.form.email" />
                                    </label>
                                </div>
                                <div className="controls">
                                    <input ref="email" type="text" placeholder={formatMessage({id: "container.signup.form.email"})} className="width-full"/>
                                </div>
                            </div>
                            <div className="control-group">
                                <div className="control-label">
                                    <label className="assistive-text">
                                        <FormattedMessage id="component.login.form.password" />
                                    </label>
                                </div>
                                <div className="controls">
                                    <input ref="password" type="password" placeholder={formatMessage({id: "container.signup.form.password"})} className="width-full"/>
                                </div>
                            </div>
                            <div className="control-group">
                                <div className="control-label">
                                    <label className="assistive-text">
                                        <FormattedMessage id="component.login.form.password" />
                                    </label>
                                </div>
                                <div className="controls">
                                    <input ref="password2" type="password" placeholder={formatMessage({id: "container.signup.form.passwordAgain"})} className="width-full"/>
                                </div>
                            </div>
                            <div className="control-group">
                                <div className="controls">
                                    <label className="checkbox"><input ref="termsOfService" required="required" type="checkbox"/>
                                        <div className="controls">
                                            <p><FormattedMessage id="container.signup.form.termsAndConditions.iAgreeTo"/> <a href={TERMS_AND_CONDITIONS_PAGE} target="_blank"><FormattedMessage id="container.signup.form.termsAndConditions.cloudFlaresTermsAndConditions"/></a> <FormattedMessage id="container.signup.form.termsAndConditions.and"/> <a href={PRIVACY_POLICY_PAGE} target="_blank"><FormattedMessage id="container.signup.form.termsAndConditions.privacyPolicy"/></a><FormattedMessage id="container.signup.form.termsAndConditions.period"/></p>
                                        </div>
                                    </label>
                                    </div>
                                </div>
                            <div className="control-group">
                                <div className="controls">
                                    <button type="submit" className="btn btn-success btn-large width-full">
                                        <FormattedMessage id="container.signup.form.button" />
                                    </button>
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </section>
        );
    }

    handleSignUpSubmit() {
        let { dispatch } = this.props;
        let { formatMessage } = this.props.intl;

        let email = this.refs.email.value;
        let password = this.refs.password.value;
        let password2 = this.refs.password2.value;
        let isTermsOfServiceChecked = this.refs.termsOfService.value;

        if(!isTermsOfServiceChecked) {
            dispatch(notificationAddError(formatMessage({id: "container.signup.error.termsOfService"})));
            return;
        }

        if(_.isEmpty(email)) {
            dispatch(notificationAddError(formatMessage({id: "container.signup.error.emailBlank"})));
            return;
        }

        if(_.isEmpty(password) || _.isEmpty(password2)) {
            dispatch(notificationAddError(formatMessage({id: "container.signup.error.passwordBlank"})));
            return;
        }

        if(password !== password2) {
            dispatch(notificationAddError(formatMessage({id: "container.signup.error.passwordsDontMatch"}))) ;
        }

        dispatch(UserActionCreators.asyncUserSignup(email, password));
    }
}

function mapStateToProps(state) {
    return { state: state }
}

export default injectIntl(connect(mapStateToProps)(SignUpPage));