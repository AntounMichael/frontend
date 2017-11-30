import destroyApp from '../../helpers/destroy-app';
import {
  module,
  test
} from 'qunit';
import startApp from 'ilios/tests/helpers/start-app';
import setupAuthentication from 'ilios/tests/helpers/setup-authentication';
import page from 'ilios/tests/pages/dashboard';

var application;

module('Acceptance: Dashboard Reports', {
  beforeEach: function() {
    application = startApp();
    const school = server.create('school');
    const user = setupAuthentication(application, { id: 4136, schoolId: 1 });
    const vocabulary = server.create('vocabulary');
    const term = server.create('term', { vocabulary });
    server.create('academic-year', {
      id: 2015
    });
    server.create('academic-year', {
      id: 2016
    });
    const firstCourse = server.create('course', {
      school,
      year: 2015,
    });
    server.create('session', {
      course: firstCourse,
      terms: [term],
    });
    const secondCourse = server.create('course', {
      school,
      year: 2016,
    });
    server.create('session', {
      course: secondCourse,
      terms: [term],
    });
    server.create('report', {
      subject: 'session',
      prepositionalObject: 'course',
      prepositionalObjectTableRowId: firstCourse.id,
      user,
      school,
    });
    server.create('report', {
      title: null,
      subject: 'session',
      prepositionalObject: 'term',
      prepositionalObjectTableRowId: term.id,
      user,
      school,
    });
  },

  afterEach: function() {
    destroyApp(application);
  }
});

test('visiting /dashboard', async function(assert) {
  await page.visit();
  assert.equal(currentPath(), 'dashboard');
});

test('shows reports', async function(assert) {
  await page.visit();
  assert.equal(page.myReports.reports().count, 2);
  assert.equal(page.myReports.reports(0).title, 'All Sessions for term 0 in school 0');
  assert.equal(page.myReports.reports(1).title, 'my report 0');
});

test('first report works', async function(assert) {
  await page.visit();
  assert.equal(page.myReports.reports().count, 2);
  await page.myReports.reports(1).select();
  assert.equal(page.myReports.selectedReport.title, 'my report 0');
  assert.equal(page.myReports.selectedReport.results().count, 1);
  assert.equal(page.myReports.selectedReport.results(0).text, '2015 - 2016 course 0 session 0');
});

test('no year filter on reports with a course prepositional object', async function(assert) {
  await page.visit();
  assert.equal(page.myReports.reports().count, 2);
  await page.myReports.reports(1).select();
  assert.equal(page.myReports.selectedReport.title, 'my report 0');
  assert.notOk(page.myReports.selectedReport.yearsFilterExists);
});

test('second report works', async function (assert) {
  await page.visit();
  assert.equal(page.myReports.reports().count, 2);
  await page.myReports.reports(0).select();
  assert.equal(page.myReports.selectedReport.title, 'All Sessions for term 0 in school 0');
  assert.equal(page.myReports.selectedReport.results().count, 2);
  assert.equal(page.myReports.selectedReport.results(0).text, '2015 - 2016 course 0 session 0');
  assert.equal(page.myReports.selectedReport.results(1).text, '2016 - 2017 course 1 session 1');
});

test('year filter works', async function (assert) {
  await page.visit();
  assert.equal(page.myReports.reports().count, 2);
  await page.myReports.reports(0).select();
  assert.equal(page.myReports.selectedReport.title, 'All Sessions for term 0 in school 0');
  assert.ok(page.myReports.selectedReport.yearsFilterExists);
  assert.equal(page.myReports.selectedReport.results().count, 2);
  await page.myReports.selectedReport.chooseYear('2016 - 2017');
  assert.equal(page.myReports.selectedReport.results().count, 1);
  assert.equal(page.myReports.selectedReport.results(0).text, '2016 - 2017 course 1 session 1');
});