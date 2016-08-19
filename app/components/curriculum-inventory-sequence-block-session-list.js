import Ember from 'ember';
import { task } from 'ember-concurrency';

const { Component, computed } = Ember;

export default Component.extend({
  linkedSessions: [],
  linkableSessionsBuffer: [],
  classNames: ['curriculum-inventory-sequence-block-session-list', 'resultslist'],
  tagName: 'section',
  sortBy: 'title',

  didReceiveAttrs(){
    this._super(...arguments);
    const sequenceBlock = this.get('sequenceBlock');
    const linkableSessions = this.get('linkableSessions');
    this.get('loadAttr').perform(sequenceBlock, linkableSessions);
  },

  loadAttr: task(function * (sequenceBlock, linkableSessions) {
    const linkedSessions = yield sequenceBlock.get('sessions');
    const linkableSessionsBuffer = yield linkableSessions;
    this.setProperties({
      linkedSessions,
      linkableSessionsBuffer
    });
  }),

  sortedAscending: computed('sortBy', function(){
    const sortBy = this.get('sortBy');
    return sortBy.search(/desc/) === -1;
  }),

  actions: {
    sortBy(what){
      const sortBy = this.get('sortBy');
      if(sortBy === what){
        what += ':desc';
      }
      this.get('setSortBy')(what);
    },
  }
});
