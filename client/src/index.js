/* global document */

import React, { Component } from 'react';
import { render } from 'react-dom';
import { debounce } from 'throttle-debounce';
import { createPatch, applyPatch } from 'diff';
import Request from 'axios';

import styles from './index.scss';

class App extends Component {
  constructor(args) {
    super(args);

    this.state = {
      currentText: '',
      lastSyncedText: '',
      postID: 1, // hardcoded for now.
      userID: 'abinavseelan', // hardcoded for now
      error: false,
      toast: '',
    };

    this.syncServer = debounce(500, this.syncServer.bind(this));
    this.handleInput = this.handleInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    Request
      .get(`/api/comments/drafts?post_id=${this.state.postID}&user_id=${this.state.userID}`)
      .then((result) => {
        if (result.data.draft) {
          this.setState({
            lastSyncedText: result.data.draft,
            currentText: result.data.draft,
          });
        }
      });
  }

  syncServer() {
    const { lastSyncedText, currentText, postID, error, userID } = this.state;
    const patch = createPatch('tmp', lastSyncedText, currentText, 'tmp', 'tmp');

    if (error) {
      return;
    }

    Request
      .put('/api/comments/drafts', {
        patch,
        userID,
        postID,
      })
      .then(() => {
        this.setState({
          lastSyncedText: applyPatch(lastSyncedText, patch),
        });
      })
      .catch(() => {
        this.setState({
          error: true,
          toast: 'Oops. Something went wrong while syncing your work. Please refresh the page',
        });
      });
  }

  handleInput(event) {
    const text = event.target.value;
    this.setState({ currentText: text }, () => {
      this.syncServer();
    });
  }

  handleSubmit() {
    Request
      .post('/api/comments', {
        comment: this.state.currentText,
        postID: this.state.postID,
        userID: this.state.userID,
      })
      .then(() => {
        this.setState({
          toast: 'Success! Comment posted.',
          currentText: '',
          lastSyncedText: '',
        });
      })
      .catch(() => {
        this.setState({
          error: true,
          toast: 'Oops. Something went wrong while syncing your work. Please refresh the page',
        });
      });
  }

  render() {
    const { toast, error, currentText } = this.state;
    const toastClass = error ? styles['toast-error'] : styles['toast-success'];

    return (
      <div className={styles.container}>
        {
          toast
            ? (
              <div className={`${styles.toast} ${toastClass}`}>
                {this.state.toast}
              </div>
            )
            : (
              null
            )
        }
        <textarea
          className={styles['comments-container']}
          placeholder="Write your response..."
          onChange={this.handleInput}
          value={currentText}
        />
        <div className={styles.cta}>
          <button className={styles['post-btn']} onClick={this.handleSubmit}>
            Post Comment
          </button>
        </div>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app-container');
  render(<App />, container);
});
