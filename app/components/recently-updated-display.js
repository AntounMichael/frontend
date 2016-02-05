import Ember from 'ember';
import moment from 'moment';

const { Component, computed, isEmpty } = Ember;

export default Component.extend({
  tagName: 'span',
  lastModified: null,

  classNames: ['recently-updated-display'],

  recentlyUpdated: computed('lastModified', {
    get() {
      const lastModified = this.get('lastModified');
      if (isEmpty(lastModified)) {
        return false;
      }

      const lastModifiedDate = moment(lastModified);
      const today = moment();
      const daysSinceLastUpdate = today.diff(lastModifiedDate, 'days');
      return daysSinceLastUpdate < 6 ? true : false;
    }
  }).readOnly(),
});
