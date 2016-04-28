import React, { Component, PropTypes } from 'react';
import { FormattedMessage } from 'react-intl';
import { routeActions } from 'redux-simple-router'

import Link from 'cf-component-link';

import * as UrlPaths from '../../constants/UrlPaths';
import { isLoggedIn } from '../../utils/Auth/Auth';

export default class AppNavigation extends Component {
    static propTypes = {
        dispatch: PropTypes.func.isRequired
    };

    handleClick(path) {
        let { dispatch } = this.props;
        dispatch(routeActions.push(path));
    }

    render() {
        return((isLoggedIn() && (
                <ul className="slider-nav-container apps-nav-container no-arrows" id="app-nav">
                    <li className="icon-item">
                        <Link onClick={() => this.handleClick(UrlPaths.DOMAINS_OVERVIEW_PAGE)}>
                            <span className="icon">
                                <svg className="icon-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 40 40">
                                    <path className="svg-main" d="M24,12h-8v-2h8V12z M30,12v18H10V12h4v2h12v-2H30z M16,23h-3v3h3V23z M16,18h-3v3h3V18z M27,23h-9v3h9V23z M27,18h-9v3h9V18z"></path>
                                </svg>
                            </span>
                            <span className="icon-title">
                                <FormattedMessage id="container.appNavigation.domainsOverview" />
                            </span>
                        </Link>
                    </li>
                    <li className="icon-item">
                        <Link onClick={() => this.handleClick(UrlPaths.ANALYTICS_PAGE)}>
                            <span className="icon">
                                <svg className="icon-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 40 40">
                                    <path className="svg-main" d="M21,12.7V21h-8.3c0,5,3.9,8.9,8.7,8.9c4.8,0,8.5-3.8,8.5-8.6C29.9,16.5,26,12.7,21,12.7z"></path>
                                    <path className="svg-main" d="M19,19v-8.9c-5,0.5-8.4,4.5-8.9,8.9H19z"></path>
                                </svg>
                            </span>
                            <span className="icon-title">
                                <FormattedMessage id="container.appNavigation.analytics" />
                            </span>
                        </Link>
                    </li>
                    <li className="icon-item">
                        <Link onClick={() => this.handleClick(UrlPaths.SECURITY_PAGE)}>
                            <span className="icon">
                                <svg className="icon-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 40 40">
                                    <path className="svg-main" d="M27,16v-6H13v6h-2v14h18V16H27z M24,13v3h-8v-3H24z M22,26h-4v-6h4V26z"></path>
                                </svg>
                            </span>
                            <span className="icon-title">
                                <FormattedMessage id="container.appNavigation.security" />
                            </span>
                        </Link>
                    </li>
                    <li className="icon-item">
                        <Link onClick={() => this.handleClick(UrlPaths.PERFORMANCE_PAGE)}>
                            <span className="icon">
                                <svg className="icon-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 40 40">
                                    <polygon className="svg-main" points="28,18 23,18 25,10 12,22 17,22 15,30  "></polygon>
                                </svg>
                            </span>
                            <span className="icon-title">
                                <FormattedMessage id="container.appNavigation.performance" />
                            </span>
                        </Link>
                    </li>
                    <li className="icon-item">
                        <a href={UrlPaths.SUPPORT_PAGE} target="_blank">
                            <span className="icon">
                                <svg className="icon-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 40 40">
                                    <path className="svg-main" d="M30,13l-6,6l-3-3l6-6h-7l-4,4v5l-6,6.1l4.9,4.9l6.1-6h5l4-4V13z"></path>
                                </svg>
                            </span>
                            <span className="icon-title">
                                <FormattedMessage id="container.appNavigation.support" />
                            </span>
                        </a>
                    </li>
                </ul>
            ))
        );
    }
}