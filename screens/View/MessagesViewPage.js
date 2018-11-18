import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Container,
  Row,
  Col,
  ListGroupItem,
  ListGroup,
  Button,
  Form,
  FormGroup,
  InputGroupAddon,
  InputGroup,
  TabContent, TabPane, Nav, NavItem, NavLink, Badge,
} from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';
import Spinner from 'react-spinkit';
import lodash from 'lodash';
import MessageList from '../../../../components/MessageList/MessageList';
import MessagesUsersList from './components/MessagesUsersList';
import UnicornEditor from '../../../../../../components/UnicornEditor/UnicornEditor';

class MessagesViewPage extends Component {
  constructor(props, context) {
    super(props, context);
    this.sendMessage = this.sendMessage.bind(this);
    this.joinChannel = this.joinChannel.bind(this);
    this.leaveChannel = this.leaveChannel.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.sendOnEnter = this.sendOnEnter.bind(this);
    this.toggleTab = this.toggleTab.bind(this);
    this.notifications = this.notifications.bind(this);
    this.joinConversation = this.joinConversation.bind(this);
    this.newMessage = this.newMessage.bind(this);
    this.setActive = this.setActive.bind(this);
    this.state = {
      type: 'Messages`',
      messagesList: [],
      message: '',
      channel: null,
      conversation: this.context.router.route.match.params.conversation,
      conversationData: null,
      active: '',
      conversationType: 'group',
      owner: '',
      onEnter: false,
      activeTab: '2',
      notifications: [],
      newMessages: false,
    };
    this.socket = context.socket;
  }

  componentDidMount() {
    this.setState({ isMounted: true }); // eslint-disable-line
    if (this.props.notifications.length > 0) {
      for (let i = 0, max = this.props.notifications.length; i < max; i++) {
        this.state.notifications.unshift({
          conversation: this.props.notifications[i].conversation,
          title: this.props.notifications[i].title,
        });
      }
    }
    if (this.socket) {
      this.socket.emit('getConversation', this.state.conversation);

      this.socket.on('noAccess', () => {
        this.context.router.history.push('/game/messages');
      });
      this.socket.on('receiveConversation', (data) => {
        this.setState({
          channel: data.channel,
          conversationData: data,
          activeTab: '2',
        });
      });
      this.socket.on('Messages', (data) => {
        this.setState({
          messagesList: data.messages,
          owner: data.owner,
          active: data.active,
          conversationType: data.type,
          invitedUsers: [],
        });
      });
      this.newMessage();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.count !== nextProps.count) {
      const notifications = [];
      for (let i = 0, max = nextProps.notifications.length; i < max; i++) {
        notifications.unshift({
          conversation: nextProps.notifications[i].conversation,
          title: nextProps.notifications[i].title,
        });
      }
      this.setState({ notifications });
    }
  }

  componentWillUnmount() {
    this.leaveChannel(false);
    this.socket.off('receiveConversation');
    this.socket.off('Messages.Create');
    this.socket.off('Messages');
    this.socket.off('Messages.newMessage');
  }

  onInputChange(event) {
    const app = this;
    return new Promise(function (resolve) {
      app.setState({ message: event.target.value });
      resolve(true);
    });
  }

  setActive(active, _id) {
    this.setState({ active });
    if (active && this.props.user.data._id === _id
      && !Object.keys(this.socket._callbacks)
        .includes('$newMessage')) {
      this.newMessage();
    }
  }

  sendMessage() {
    if (this.state.message.blocks.length > 0) {
      if (this.socket) {
        this.socket.emit('Messages.sendMessage', {
          message: this.state.message,
          channel: this.state.channel,
        });
      }
    }
  }

  leaveChannel(redirect) {
    if (this.socket) {
      this.socket.emit('leaveChannel', { channel: this.state.channel });
      if (redirect) this.context.router.history.push('/game/messages');
    }
  }


  sendOnEnter() {
    this.setState({ onEnter: !this.state.onEnter });
  }

  notifications() {
    return this.state.notifications.map((notification) =>
      <ListGroup className="ListGroup">
        <ListGroupItem
          id={notification.conversation} onClick={this.joinConversation} className="notification"
        >
          <FontAwesome className="fa-fw" name="envelope" />
          {notification.title}
        </ListGroupItem>
      </ListGroup>,
    );
  }

  joinConversation(event) {
    this.socket.emit('leaveChannel', { channel: this.state.channel });
    this.context.router.history.push(`/game/messages/show/${event.target.id}`);
    this.socket.emit('getConversation', event.target.id);
    this.state.notifications.splice(this.state.notifications.findIndex((notification) => {
      return notification.conversation === event.target.id;
    }), 1);
  }

  toggleTab(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab,
      });
    }
  }

  joinChannel(event) {
    const name = event.target.id;
    if (this.socket) {
      this.socket.emit('joinChannel', { channel: name });
    }
  }

  newMessage() {
    this.socket.on('Messages.newMessage', (data) => {
      this.setState({
        messagesList: this.state.messagesList.concat([data]),
        newMessages: data.author.id !== this.props.user.data.id,
      });
    });
  }

  render() {
    if (this.state.owner === 0 || lodash.isNil(this.state.conversationData)) {
      return <Spinner name="chasing-dots" color="blue" />;
    }
    return (
      <Container>
        <Row>
          <Col lg="3" className="messagesOptions">
            <Nav>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '1' })}
                  onClick={() => this.leaveChannel(true)}
                >
                  <FontAwesome name="arrow-left" />
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '2' })}
                  onClick={() => {
                    this.toggleTab('2');
                  }}
                >
                  <FontAwesome name="users" className="fa-lg" />
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '4' })}
                  onClick={() => {
                    this.toggleTab('4');
                  }}
                >
                  <FontAwesome name="envelope" className="fa-lg" />
                  {this.state.notifications.length === 0 || this.state.activeTab === '4' 
                  && <Badge className="navbadge"
                    color="danger"
                    pill
                  >{this.state.notifications.length}</Badge>}
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
              <TabPane tabId="3">
                <Row>
                  <Col sm="15" />
                </Row>
              </TabPane>
              <TabPane tabId="2">
                <MessagesUsersList
                  owner={this.state.owner}
                  conversationType={this.state.conversationType}
                  channel={this.state.channel}
                  participants={this.state.conversationData.participants}
                  setActive={this.setActive}
                />
              </TabPane>
              <TabPane tabId="4">
                <Row>
                  <Col sm="15">
                    {this.notifications()}
                  </Col>
                </Row>
              </TabPane>
            </TabContent>
          </Col>
          <Col lg="9">
            <MessageList messages={this.state.messagesList} messageType="Message" newMessages={this.state.newMessages} />
            {this.state.active && 
              <Form>
              <FormGroup>
              <InputGroup>
                <InputGroupAddon
                  onClick={this.sendOnEnter}
                  className="enterIcon"
                >
                  <FontAwesome
                    name="reply"
                    className="fa-lg fa-fw"
                    style={!this.state.onEnter ? {} : { color: '#00FF7F' }}
                  />
                </InputGroupAddon>
                <UnicornEditor setClick={(click) => {
                  this.clickChild = click;
                }} sendOnEnter={this.state.onEnter} className="input"
                  sendForm={this.sendMessage} content={this.state.message} name="textarea"
                  onInputChange={this.onInputChange}
                />
              </InputGroup>
              <Button
                id="send" className="btn-block" color="secondary"
                onClick={() => this.clickChild()}
              >{this.props.intl.messages.send}</Button>
            </FormGroup></Form> }
          </Col>
        </Row>
      </Container>
    );
  }
}

MessagesViewPage.contextTypes = {
  router: PropTypes.object,
  socket: PropTypes.object.isRequired,
};

MessagesViewPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  notifications: PropTypes.array.isRequired,
};

// Retrieve data from store as props
function mapStateToProps(store) {
  return {
    intl: store.intl,
    user: store.user,
    playersOnline: store.game.playersOnline,
  };
}

export default connect(mapStateToProps)(MessagesViewPage);
