import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import Notification from '../../components/Notification/Notification';
import * as NotificationActionCreators from '../../actions/notifications';

export default class NotificationList extends Component {
    render() {
        let {state, dispatch} = this.props;
        let notifications = state.notifications;

        return (
            <div id="notifications">
                <div className="notifications">
                    {notifications.map(notification =>
                        <Notification key={notification.key} notification={notification} dispatch={dispatch} />
                    )}
                </div>
            </div>
        );
    }
}