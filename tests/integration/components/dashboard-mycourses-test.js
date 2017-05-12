import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import tHelper from "ember-i18n/helper";
import wait from 'ember-test-helpers/wait';

const { Object:EmberObject, run, RSVP, Service } = Ember;
const { resolve } = RSVP;

let mockCourses = [
  EmberObject.create({title: 'first', level: 4, academicYear: '2012-2013', locked: false, archived: false}),
  EmberObject.create({title: 'second', level: 1, academicYear: '2013-2014', locked: false, archived: false}),
  EmberObject.create({title: 'third', level: 1, academicYear: '2012-2013', locked: false, archived: false}),
];

let currentUserMock = Service.extend({
  activeRelatedCoursesInThisYearAndLastYear: resolve(mockCourses),
  userIsFaculty: resolve(false),
  userIsCourseDirector: resolve(false),
  userIsDeveloper: resolve(true),
});

let currentUserMockNoCourses = Service.extend({
  activeRelatedCoursesInThisYearAndLastYear: resolve([]),
  userIsFaculty: resolve(true),
  userIsCourseDirector: resolve(false),
  userIsDeveloper: resolve(false),
});

let currentUserMockUnprivileged = Service.extend({
  activeRelatedCoursesInThisYearAndLastYear: resolve(mockCourses),
  userIsFaculty: resolve(false),
  userIsCourseDirector: resolve(false),
  userIsDeveloper: resolve(false),
});

moduleForComponent('dashboard-mycourses', 'Integration | Component | dashboard mycourses', {
  integration: true,
  beforeEach: function() {
    this.container.lookup('service:i18n').set('locale', 'en');
    this.registry.register('helper:t', tHelper);
  }
});

test('list courses for privileged users', async function(assert) {
  assert.expect(8);
  this.register('service:currentUser', currentUserMock);
  this.render(hbs`{{dashboard-mycourses}}`);
  const header = '.dashboard-block-header';

  await wait();
  assert.equal(this.$(header).text().trim(), 'My Courses');
  for(let i = 0; i < 2; i++){
    let a = this.$(`table a:eq(${i})`);
    assert.equal(a.length, 1);
    let tds = this.$(`table tr:eq(${i}) td`);
    assert.equal(tds.eq(0).text().trim(), mockCourses[i].academicYear);
    assert.equal(tds.eq(1).text().trim(), mockCourses[i].title);
  }

  assert.equal(this.$(`table tr`).length, 3);

});


test('list courses for un-privileged users', function(assert) {
  assert.expect(11);
  this.register('service:currentUser', currentUserMockUnprivileged);
  this.render(hbs`{{dashboard-mycourses}}`);
  assert.equal(this.$('.dashboard-block-header').text().trim(), 'My Courses');

  run.later(()=> {
    for(let i = 0; i < 3; i++){
      let a = this.$(`table a:eq(${i})`);
      assert.equal(a.length, 0);
      let tds = this.$(`table tr:eq(${i}) td`);
      assert.equal(tds.eq(0).text().trim(), mockCourses[i].academicYear);
      assert.equal(tds.eq(1).text().trim(), mockCourses[i].title);
    }

    assert.equal(this.$(`table tr`).length, 3);
  });

});

test('display none when no courses', function(assert) {
  assert.expect(2);
  this.register('service:currentUser', currentUserMockNoCourses);
  this.render(hbs`{{dashboard-mycourses}}`);
  assert.equal(this.$('.dashboard-block-header').text().trim(), 'My Courses');

  assert.equal(this.$('.dashboard-block-body').text().trim(), 'None');

});
