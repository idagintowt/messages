import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route } from 'react-router-dom';
import PageTitle from '../../components/PageTitle/PageTitle';
import PageMenu from '../../components/PageMenu/PageMenu';
import Grid from '@material-ui/core/Grid';
import { AnimatedSwitch } from 'react-router-transition';
import * as transitions from '../../../../shared/util/pageTransitions';
import * as Routes from '../../../../../../Route';

class MessagesPage extends Component {
  static contextTypes = {
    router: PropTypes.object,
    socket: PropTypes.object.isRequired,
  };

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    notifications: PropTypes.array,
    intl: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = { active: 'list' };
  }

  componentDidMount() {
    if (this.context.socket) {
      this.context.socket.on('Messages.Create', (data) => {
        this.context.router.history.push(`/game/messages/show/${data.conversation}`);
      });
      this.context.socket.on('Conversation', (data) => {
        this.context.router.history.push(`/game/messages/show/${data.conversation}`);
      });
    }
  }

  componentWillUnmount() {
    this.context.socket.off('Conversation');
    this.context.socket.off('Messages.Create');
  }

  changeActiveState = (event, value) => {
    this.setState({ active: value });
    if (value === 'list') this.context.router.history.push('/game/messages');
    else if (value === 'create') this.context.router.history.push('/game/messages/create');
  };

  addUser = (users, official) => {
    if (users.length > 0) {
      if (this.context.socket) {
        let type = users.length > 1 ? 'group' : 'private';
        if (official) type = 'official';
        this.context.socket.emit('createChannel', {
          type: 'Messages',
          conversationType: type,
          id: users,
        });
      }
    }
  };

  render() {
    const menuItems = {
      list: 'Lista konwersacji',
      create: 'Stwórz konwersację',
    };

    return (
      <Grid container spacing={0}>
        <Grid item xs={12}><PageTitle title={this.props.intl.messages.messages} /></Grid>
        <Grid item xs={12} className="mb-4"><PageMenu menuData={menuItems} active={this.state.active} handleChange={this.changeActiveState} /></Grid>
        <Grid item xs={12} className="pl-4 pr-4">
          <AnimatedSwitch atEnter={transitions.bounceTransition.atEnter}
            atLeave={transitions.bounceTransition.atLeave}
            atActive={transitions.bounceTransition.atActive}
            mapStyles={transitions.mapStyles}
            className="routeWrapper"
          >
            <Route exact path={`${this.context.router.route.match.url}/`} render={() => (
              <Routes.MessagesListPage addUser={this.addUser} {...this.props} />
            )} />
            <Route path={`${this.context.router.route.match.url}/create`} render={() => (
              <Routes.MessagesCreatePage addUser={this.addUser} {...this.props} />
            )} />
            <Route path={`${this.context.router.route.match.url}/show/:conversation`} render={() => (
              <Routes.MessagesViewPage count={this.props.notifications.length}
                notifications={this.props.notifications} {...this.props}
              />
            )} />
          </AnimatedSwitch>
        </Grid>
      </Grid>
    );
  }
}

// Retrieve data from store as props
function mapStateToProps(store) {
  return {
    intl: store.intl,
  };
}

export default connect(mapStateToProps)(MessagesPage);
