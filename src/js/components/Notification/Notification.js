import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import * as NotificationActionCreators from '../../actions/notifications';

export default class Notification extends Component {

    closeNotification() {
        let { dispatch, notification } = this.props;
        dispatch(NotificationActionCreators.notificationRemove(notification.key));
    }

    componentDidMount() {
        setTimeout(() => this.closeNotification(), 5000);
    }

    render() {
        let notification = this.props.notification;
        let levelCSSClass = "alert " + notification.level.toLowerCase();
        return (
            <div className={levelCSSClass}>
                <span className="progress"></span>
                <span className="close" onClick={() => this.closeNotification()}></span>
                <span className="message">
                    <p>{notification.localized ? <FormattedMessage id={notification.message}/> : notification.message}</p>
                </span>
            </div>
        );
    }
}