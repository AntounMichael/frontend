import moment from 'moment';
import DS from 'ember-data';
import Ember from 'ember';
import PublishableModel from 'ilios/mixins/publishable-model';
import CategorizableModel from 'ilios/mixins/categorizable-model';

const { computed, isEmpty, isPresent, RSVP } = Ember;
const { alias, mapBy, notEmpty, sum } = computed;
const { attr, belongsTo, hasMany, Model, PromiseArray, PromiseObject } = DS;
const { all, defer } = RSVP;

export default Model.extend(PublishableModel, CategorizableModel, {
  title: attr('string'),
  attireRequired: attr('boolean'),
  equipmentRequired: attr('boolean'),
  supplemental: attr('boolean'),
  attendanceRequired: attr('boolean'),
  updatedAt: attr('date'),
  sessionType: belongsTo('session-type', {async: true}),
  course: belongsTo('course', {async: true}),
  ilmSession: belongsTo('ilm-session', {async: true}),
  objectives: hasMany('objective', {async: true}),
  meshDescriptors: hasMany('mesh-descriptor', {async: true}),
  sessionDescription: belongsTo('session-description', {async: true}),
  learningMaterials: hasMany('session-learning-material', {async: true}),
  offerings: hasMany('offering', {async: true}),
  administrators: hasMany('user', {
    async: true,
    inverse: 'administeredSessions'
  }),
  isIndependentLearning: notEmpty('ilmSession.content'),
  offeringLearnerGroups: mapBy('offerings', 'learnerGroups'),
  offeringLearnerGroupsLength: mapBy('offeringLearnerGroups', 'length'),
  learnerGroupCount: sum('offeringLearnerGroupsLength'),
  sortedOfferingsByDate: computed('offerings.@each.startDate', {
    get() {
      let deferred = defer();
      this.get('offerings').then(offerings => {
        let sortedOfferingsByDate = offerings.filter(offering => isPresent(offering.get('startDate'))).sort((a, b) => {
          let aDate = moment(a.get('startDate'));
          let bDate = moment(b.get('startDate'));
          if(aDate === bDate){
            return 0;
          }
          return aDate > bDate ? 1 : -1;
        });

        deferred.resolve(sortedOfferingsByDate);
      });

      return PromiseArray.create({
        promise: deferred.promise
      });
    }
  }).readOnly(),

  firstOfferingDate: computed('sortedOfferingsByDate.@each.startDate', 'ilmSession.dueDate', function(){
    var deferred = defer();
    this.get('ilmSession').then(ilmSession => {
      if(ilmSession){
        deferred.resolve(ilmSession.get('dueDate'));
      } else {
        this.get('sortedOfferingsByDate').then(offerings => {
          if(isEmpty(offerings)){
            deferred.resolve(null);
          } else {
            deferred.resolve(offerings.get('firstObject.startDate'));
          }
        });
      }
    });
    return PromiseObject.create({
      promise: deferred.promise
    });
  }),

  /**
   * The maximum duration in hours (incl. fractions) of any session offerings.
   * @property sortedTerms
   * @type {Ember.computed}
   * @readonly
   * @public
   */
  maxSingleOfferingDuration: computed('offerings.@each.startDate', 'offerings.@each.endDate', function(){
    let deferred = defer();
    this.get('offerings').then(offerings => {
      if (! offerings.length) {
        deferred.resolve(0);
      } else {
        const sortedOfferings = offerings.toArray().sort(function (a, b) {
          const diffA = moment(a.get('endDate')).diff(moment(a.get('startDate')), 'minutes');
          const diffB = moment(b.get('endDate')).diff(moment(b.get('startDate')), 'minutes');
          if (diffA > diffB) {
            return 1;
          } else if (diffA < diffB) {
            return -1;
          }
          return 0;
        });
        const offering = sortedOfferings[0];
        const duration = moment(offering.get('endDate')).diff(moment(offering.get('startDate')), 'hours', true);
        deferred.resolve(duration.toFixed(2));
      }
    });

    return PromiseObject.create({
      promise: deferred.promise
    });
  }).readOnly(),

  /**
   * The total duration in hours (incl. fractions) of all session offerings.
   * @property sortedTerms
   * @type {Ember.computed}
   * @readonly
   * @public
   */
  totalSumOfferingsDuration: computed('offerings.@each.startDate', 'offerings.@each.endDate', function() {
    let deferred = defer();
    this.get('offerings').then(offerings => {
      if (!offerings.length) {
        deferred.resolve(0);
      } else {
        let total = 0;
        offerings.forEach(offering => {
          total = total + moment(offering.get('endDate')).diff(moment(offering.get('startDate')), 'hours', true);
        });
        deferred.resolve(total.toFixed(2));
      }
    });

    return PromiseObject.create({
      promise: deferred.promise
    });
  }).readOnly(),

  searchString: computed('title', 'sessionType.title', 'status', function(){
    return this.get('title') + this.get('sessionType.title') + this.get('status');
  }),
  optionalPublicationLengthFields: ['terms', 'objectives', 'meshDescriptors'],
  requiredPublicationIssues: computed(
    'title',
    'offerings.length',
    'ilmSession.dueDate',
    'isIndependentLearning',
    function(){
      if(!this.get('isIndependentLearning')){
        this.set('requiredPublicationLengthFields', ['offerings']);
        this.set('requiredPublicationSetFields', ['title']);
      } else {
        this.set('requiredPublicationLengthFields', []);
        this.set('requiredPublicationSetFields', ['title', 'ilmSession.dueDate']);
      }
      return this.getRequiredPublicationIssues();
    }
  ),
  optionalPublicationIssues: computed(
    'terms.length',
    'objectives.length',
    'meshDescriptors.length',
    function(){
      return this.getOptionalPublicationIssues();
    }
  ),

  /**
   * Learner-groups associated with this session via its offerings.
   * @property associatedOfferingLearnerGroups
   * @type {Ember.computed}
   * @public
   */
  associatedOfferingLearnerGroups: computed('offerings.@each.learnerGroups', function(){
    var deferred = defer();
    this.get('offerings').then(function(offerings){
      all(offerings.mapBy('learnerGroups')).then(function(offeringLearnerGroups){
        var allGroups = [];
        offeringLearnerGroups.forEach(function(learnerGroups){
          learnerGroups.forEach(function(group){
            allGroups.pushObject(group);
          });
        });
        var groups = allGroups?allGroups.uniq().sortBy('title'):[];
        deferred.resolve(groups);
      });
    });

    return PromiseArray.create({
      promise: deferred.promise
    });
  }),

  /**
   * Learner-groups associated with this session via its ILM.
   * @property associatedIlmLearnerGroups
   * @type {Ember.computed}
   * @public
   */
  associatedIlmLearnerGroups: computed('ilmSession.learnerGroups', function(){
    var deferred = defer();
    this.get('ilmSession').then(function(ilmSession){
      if (! isPresent(ilmSession)) {
        deferred.resolve([]);
        return;
      }

      ilmSession.get('learnerGroups').then(learnerGroups => {
        let sortedGroups = learnerGroups.sortBy('title');
        deferred.resolve(sortedGroups);
      });
    });

    return PromiseArray.create({
      promise: deferred.promise
    });
  }),

  /**
   * Learner-groups associated with this session via its ILM and offerings.
   * @property associatedLearnerGroups
   * @type {Ember.computed}
   * @public
   */
  associatedLearnerGroups: computed('associatedIlmLearnerGroups.[]', 'associatedOfferingLearnerGroups.[]', function(){
    var deferred = defer();
    this.get('associatedIlmLearnerGroups').then(ilmLearnerGroups => {
      this.get('associatedOfferingLearnerGroups').then(offeringLearnerGroups => {
        let allGroups = [].pushObjects(offeringLearnerGroups.toArray()).pushObjects(ilmLearnerGroups.toArray());
        if (! isEmpty(allGroups)) {
          allGroups = allGroups.uniq().sortBy('title');
        }
        deferred.resolve(allGroups);
      });
    });

    return PromiseArray.create({
      promise: deferred.promise
    });
  }),

  assignableVocabularies: alias('course.assignableVocabularies'),
});
