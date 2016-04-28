import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

/*
 * 20160221 jwineman This should be replaced with cf-component-loading ASAP
 */

export default class Loading extends Component {
    render() {
        return (
            <span className="icon-loading">&nbsp;&nbsp;&nbsp;&nbsp;</span>
        );
    }
}