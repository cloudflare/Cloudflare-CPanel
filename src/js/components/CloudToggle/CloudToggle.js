import React, { Component, PropTypes } from 'react';

/*
 * This is a modified copy of cf-component-toggle which produces
 * <label class="proxy">
 *     <input type="checkbox">
 *     <span class="cloud"></span>
 *</label>
 *
 * It will eventually be replaced by cf-component-*
 */

export default class CloudToggle extends React.Component {
    static propTypes = {
        label: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.oneOf([false])
        ]).isRequired,
        name: PropTypes.string,
        value: PropTypes.bool,
        onChange: PropTypes.func,
        onFocus: PropTypes.func,
        onBlur: PropTypes.func
    };

    handleChange = e => {
        this.props.onChange(e.target.checked);
    };

    render() {
        let className = 'proxy';

        return (
            <label htmlFor={this.props.name} className={className}>
                <input
                    type="checkbox"
                    id={this.props.name}
                    name={this.props.name}
                    checked={this.props.value}
                    onChange={this.handleChange}
                    onFocus={this.props.onFocus}
                    onBlur={this.props.onBlur}/>
                <span className="cloud">
                  {this.props.label}
                </span>
            </label>
        );
    }
}
