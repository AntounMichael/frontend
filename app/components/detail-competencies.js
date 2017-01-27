import Ember from 'ember';

const { Component, computed, RSVP } = Ember;
const { Promise } = RSVP;

export default Component.extend({
  course: null,
  editable: true,
  tagName: 'section',
  classNameBindings: [':detail-competencies', 'showCollapsible:collapsible'],

  /**
   *
   * @property showCollapsible
   * @type {Ember.computed}
   * @public
   */
  showCollapsible: computed('course.competencies.[]', function () {
    return new Promise(resolve => {
      this.get('course.competencies').then(competencies => {
        resolve(competencies.length);
      });
    });
  }),

  actions: {
    collapse(){
      this.get('course.competencies').then(competencies => {
        if (competencies.length) {
          this.attrs.collapse();
        }
      });
    },
  }
});
