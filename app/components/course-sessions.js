import Ember from 'ember';

const { Component, computed, inject, RSVP } = Ember;
const { map } = RSVP;

export default Component.extend({
  i18n: inject.service(),
  tagName: 'section',
  classNames: ['course-sessions'],

  course: null,
  sortBy: null,
  filterBy: null,
  sessionsCount: computed('course.sessions.[]', function(){
    const course = this.get('course');
    const sessionIds = course.hasMany('sessions').ids();

    return sessionIds.length;
  }),
  sessionObjects: computed('course.sessions.[]', async function(){
    const i18n = this.get('i18n');
    const course = this.get('course');
    const sessions = await course.get('sessions');
    const sessionObjects = await map(sessions.toArray(), async session => {
      let sessionObject = {
        session,
        course,
        id: session.get('id'),
        title: session.get('title'),
        isPublished: session.get('isPublished'),
        isNotPublished: session.get('isNotPublished'),
        isScheduled: session.get('isScheduled'),
      };
      const sessionType = await session.get('sessionType');
      sessionObject.sessionTypeTitle = sessionType.get('title');
      const ilmSession = await session.get('ilmSession');
      if (ilmSession) {
        sessionObject.isIlm = true;
        sessionObject.firstOfferingDate = ilmSession.get('dueDate');
      } else {
        sessionObject.isIlm = false;
        const firstOfferingDate = await session.get('firstOfferingDate');
        sessionObject.firstOfferingDate = firstOfferingDate;
      }
      const offerings = await session.get('offerings');
      sessionObject.offeringCount = offerings.length;
      const offeringLearerGroupCount = offerings.reduce((total, offering) => {
        let count = offering.hasMany('learnerGroups').ids().length;

        return total + count;
      }, 0);
      let ilmLearnerGroupCount = 0;
      if (ilmSession) {
        const learnerGroupIds = ilmSession.hasMany('learnerGroups').ids();
        ilmLearnerGroupCount = learnerGroupIds.length;
      }
      const learnerGroupCount = offeringLearerGroupCount + ilmLearnerGroupCount;
      sessionObject.learnerGroupCount = learnerGroupCount;
      let status = i18n.t('general.notPublished');
      if(session.get('isPublished')){
        status = i18n.t('general.published');
      }
      if(session.get('publishedAsTbd')){
        status = i18n.t('general.scheduled');
      }
      sessionObject.status = status.toString();
      sessionObject.searchString = sessionObject.title + sessionObject.sessionTypeTitle + sessionObject.status;

      return sessionObject;
    });

    return sessionObjects;
  }),
});
