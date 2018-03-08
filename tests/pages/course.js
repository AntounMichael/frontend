import {
  attribute,
  clickable,
  clickOnText,
  create,
  collection,
  fillable,
  isVisible,
  text,
  value,
  visitable
} from 'ember-cli-page-object';
import { fillInFroalaEditor, froalaEditorValue } from 'ilios/tests/helpers/froala-editor';
import { datePicker } from 'ilios/tests/helpers/date-picker';
import meshManager from 'ilios/tests/pages/components/mesh-manager';

export default create({
  scope: '[data-test-ilios-course-details]',
  visit: visitable('/courses/:courseId'),

  objectives: {
    scope: '[data-test-detail-objectives]',
    current: collection({
      scope: 'table',
      itemScope: 'tbody tr',
      item: {
        title: text('td', { at: 0 }),
        parents: collection({
          scope: 'td',
          itemScope: '[data-test-parent]',
          item: {
            title: text(),
          },
        }, { at: 1 }),
      },
    }),
  },

  learningMaterials: {
    scope: '[data-test-detail-learning-materials]',
    createNew: clickable('.detail-learningmaterials-actions button'),
    pickNew: clickOnText('.detail-learningmaterials-actions ul li'),
    save: clickable('.actions button.bigadd'),
    cancel: clickable('.actions button.bigcancel'),
    canSearch: isVisible('[data-test-search-box]'),
    canCreateNew: isVisible('.detail-learningmaterials-actions .action-menu'),
    canCollapse: isVisible('.detail-learningmaterials-actions .collapse-button'),
    search: fillable('[data-test-search-box] input'),
    current: collection({
      scope: '.detail-learningmaterials-content table',
      itemScope: 'tbody tr',
      item: {
        title: text('td', { at: 0 }),
        owner: text('td', { at: 1 }),
        required: text('td', { at: 2 }),
        notes: text('td', { at: 3 }),
        mesh: text('td', { at: 4 }),
        status: text('td', { at: 5 }),
        isNotePublic: isVisible('i.fa-eye'),
        isTimedRelease: isVisible('.fa-clock-o'),
        details: clickable('.link', { at: 0 }),
      },
    }),
    searchResults: collection({
      scope: '.lm-search-results',
      itemScope: '> li',
      item: {
        title: text('h4'),
        description: text('learning-material-description'),
        hasFileIcon: isVisible('.fa-file'),
        properties: collection({
          scope: '.learning-material-properties',
          itemScope: 'li',
          item: {
            value: text(),
          },
        }),
        add: clickable(),
      },
    }),
    newLearningMaterial: {
      scope: '.new-learningmaterial',
      name: fillable('input', { at: 0}),
      author: fillable('input', { at: 1}),
      url: fillable('input', { at: 2}),
      citation: fillable('textarea'),
      userName: text('.owninguser'),
      status: fillable('select', { at: 0}),
      role: fillable('select', { at: 1 }),
      description: fillInFroalaEditor('.fr-box'),
      save: clickable('.done'),
      cancel: clickable('.cancel'),
    },
    manager: {
      scope: '.learningmaterial-manager',
      name: text('.displayname'),
      author: text('.originalauthor'),
      description: text('.description'),
      copyrightPermission: text('.copyrightpermission'),
      copyrightRationale: text('.copyrightrationale'),
      uploadDate: text('.upload-date'),
      downloadText: text('.downloadurl'),
      downloadUrl: attribute('href', '.downloadurl a'),
      link: text('.link'),
      citation: text('.citation'),
      hasCopyrightPermission: isVisible('.copyrightpermission'),
      hasCopyrightRationale: isVisible('.copyrightrationale'),
      hasLink: isVisible('.link'),
      hasCitation: isVisible('.citation'),
      hasFile: isVisible('.downloadurl'),
      required: clickable('.required .switch-handle'),
      publicNotes: clickable('.publicnotes .switch-handle'),
      status: fillable('select', { at: 0}),
      statusValue: value('select', { at: 0}),
      notes: fillInFroalaEditor('.fr-box'),
      notesValue: froalaEditorValue('.fr-box'),
      addStartDate: clickable('[data-test-add-start-date]'),
      addEndDate: clickable('[data-test-add-end-date]'),
      timedReleaseSummary: text('.timed-release-schedule'),
      save: clickable('.done'),
      cancel: clickable('.cancel'),
      meshManager,
      startDate: datePicker('.start-date input'),
      startTime: {
        scope: '.start-time',
        hour: fillable('select', {at: 0}),
        minute: fillable('select', {at: 1}),
        ampm: fillable('select', {at: 2}),
      },
      endDate: datePicker('.end-date input'),
      endTime: {
        scope: '.end-time',
        hour: fillable('select', {at: 0}),
        minute: fillable('select', {at: 1}),
        ampm: fillable('select', {at: 2}),
      },
      hasEndDateValidationError: isVisible('[data-test-end-date-validation-error-message]')
    }
  },

  meshTerms: {
    scope: '[data-test-detail-mesh]',
    manage: clickable('.actions button'),
    save: clickable('.actions button.bigadd'),
    cancel: clickable('.actions button.bigcancel'),
    current: collection({
      scope: '.selected-mesh-terms',
      itemScope: 'li',
      item: {
        title: text('.term-title'),
      },
    }),
    meshManager,
  },

  cohorts: {
    scope: '[data-test-detail-cohorts]',
    manage: clickable('.actions button'),
    save: clickable('.actions button.bigadd'),
    cancel: clickable('.actions button.bigcancel'),
    current: collection({
      scope: 'table',
      itemScope: 'tbody tr',
      item: {
        school: text('td', { at: 0 }),
        program: text('td', { at: 1 }),
        cohort: text('td', { at: 2 }),
        level: text('td', { at: 3 }),
      },
    }),
    selected: collection({
      scope: '.selected-cohorts',
      itemScope: 'li',
      item: {
        name: text(),
        remove: clickable(),
      },
    }),
    selectable: collection({
      scope: '.selectable-cohorts',
      itemScope: 'li',
      item: {
        name: text(),
        add: clickable(),
      },
    }),
  },

});
