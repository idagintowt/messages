import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Col, Form, ListGroup, ListGroupItem, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select2 from '../../../../../components/Form/Select2';
import FontAwesome from 'react-fontawesome';
import Spinner from 'react-spinkit';
import _ from 'lodash';
import AnimatedButton from '../../../../../../../components/AnimatedButton/AnimatedButton';

class MessagesUsersList extends Component {
  constructor(props, context) {
    super(props, context);
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.activateUser = this.activateUser.bind(this);
    this.handleNickChange = this.handleNickChange.bind(this);
    this.state = {
      participants: [],
      invitedUsers: [],
      channel: this.props.channel,
    };
    this.socket = context.socket;
  }

  componentDidMount() {
    if (this.socket) {
      // Called when user is removed from conversation
      this.socket.on('Messages.Remove', (data) => {
        const participants = [...this.state.participants];
        const participant = participants.find((elem) => {
          return elem._id === data.removed;
        });
        if (!_.isNil(participant)) {
          participant.removed = data.removedBy;
          this.setState({ participants });
          if (this.props.user.data._id === data.removed) {
            this.props.setActive(false, participant._id);
            this.socket.off('Messages.newMessage');
          }
        }
      });
      // Called when user is activated in conversation
      this.socket.on('Messages.Activate', (_id) => {
        const participants = [...this.state.participants];
        const participant = participants.find((elem) => {
          return elem._id === _id;
        });
        if (!_.isNil(participant)) {
          participant.removed = false;
          this.setState({ participants });
          if (this.props.user.data._id === _id) {
            this.socket.emit('joinChannel', { channel: this.props.channel });
            this.props.setActive(true, _id);
          }
        }
      });
      this.socket.on('Messages.updateUsers', (users) => {
        if (this.state.participants) {
          const participants = [...this.state.participants];
          participants.push(...users);
          this.setState({ participants });
        }
      });
    }
    this.setState({ participants: this.props.participants });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.channel !== this.props.channel) {
      this.setState({ participants: this.props.participants });
    }
  }

  componentWillUnmount() {
    this.socket.off('Messages.Create');
    this.socket.off('Messages.Remove');
    this.socket.off('Messages.Activate');
    this.socket.off('Messages.updateUsers');
  }

  addUser() {
    if (this.state.invitedUsers.length > 0 && this.props.conversationType !== 'private') {
      if (this.socket) {
        if (this.props.channel.length > 0) {
          this.socket.emit('Messages.addUser', { channel: this.props.channel, id: this.state.invitedUsers.map(a => a._id) });
        } else {
          const type = this.state.invitedUsers.length > 1 ? 'group' : 'private';
          this.socket.emit('createChannel', {
            type: this.state.type,
            conversationType: type,
            id: this.state.invitedUsers.map(a => a._id),
          });
          this.socket.on('Messages.Create', (data) => {
            this.socket.emit('Messages.addUser', { channel: data.channel, id: this.state.invitedUsers.map(a => a._id) });
            this.setState({ invitedUsers: [], owner: data.owner, active: true, conversationType: type });
          });
        }
      }
    }
    this.setState({ invitedUsers: [] });
    return true;
  }

  removeUser(event) {
    if (this.socket) {
      this.socket.emit('Messages.removeUser', { channel: this.props.channel, _id: event.target.id });
    }
  }

  activateUser(event) {
    if (this.socket) {
      this.socket.emit('Messages.activateUser', { channel: this.props.channel, _id: event.target.id });
    }
  }

  handleNickChange(val) {
    const participants = this.state.participants.map(a => a._id);
    const users = val.filter(item => participants.indexOf(item._id) === -1);
    this.setState({ invitedUsers: users });
  }

  channelUsers() {
    if (this.state.participants) {
      const app = this;
      const icon = (id, removed) => {
        let name = removed !== false ? 'check' : 'times';
        let onClick = removed !== false ? app.activateUser : app.removeUser;
        const style = { padding: '10px', display: 'none', color: 'red' }; // Not visible in default
        if (this.props.conversationType === 'group' && (app.state.owner === app.props.user.data._id || id === app.props.user.data._id)
          || (this.props.conversationType === 'private' || this.props.conversationType === 'official') && id === app.props.user.data._id) // Owner can remove users and user can remove himself
        {
          style.display = 'inline';
          if (removed !== false && removed !== app.props.user.data._id) style.display = 'none';
          if (removed !== false) style.color = '#00FF7F';
        }
        return (<FontAwesome name={name}
          style={style}
          id={id}
          className="userIcon"
          onClick={onClick}
        />);
      };
      return this.state.participants.map((user) => {
        const style = { color: 'white' };
        // Online user is #00FF7F
        if (!_.isNil(this.props.playersOnline[user._id])) style.color = '#00FF7F';
        // Deactivated user is grey
        if (user.removed !== false) style.color = '#7f7f7f';
        return (
          <ListGroupItem
            id={user._id}
            className="user"
          ><Link style={style} to={`/game/account/${user._id}`}>{user.nick}
            [{user.id}] </Link>{icon(user._id, user.removed)}</ListGroupItem>);
      });
    } else {
      return <Spinner name="chasing-dots" color="white" />;
    }
  }

  render() {
    return (
      <Row>
        <Col sm="15">
          {(this.props.owner === this.props.user.data._id && this.props.conversationType === 'group') && <Form>
            <Select2 name="nick" type="text"
              placeholder={this.props.intl.messages.add_user}
              value={this.state.invitedUsers}
              onInputChange={this.handleNickChange}
              multiselect
              listtype="Account"
            /><AnimatedButton text="add" handleAction={this.addUser} /></Form>}
          <div
            className="usersContainer"
          >
            <ListGroup>
              {this.channelUsers()}
            </ListGroup>
          </div>
        </Col>
      </Row>

    );
  }
}

MessagesUsersList.contextTypes = {
  socket: PropTypes.object.isRequired,
};

MessagesUsersList.propTypes = {
  intl: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  conversationType: PropTypes.string.isRequired,
  participants: PropTypes.array.isRequired,
  owner: PropTypes.string.isRequired,
  setActive: PropTypes.func.isRequired,
  channel: PropTypes.string.isRequired,
};

// Retrieve data from store as props
function mapStateToProps(store) {
  return {
    intl: store.intl,
    user: store.user,
    playersOnline: store.game.playersOnline,
  };
}

export default connect(mapStateToProps)(MessagesUsersList);
