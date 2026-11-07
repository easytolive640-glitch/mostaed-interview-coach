import assert from 'node:assert/strict';
import {test} from 'node:test';
import {attachVerifiedJobs, boardTokens, currentJobs, shortlistJobs} from '../lib/server/cv-review.mjs';

test('CV matching only links to genuine IDs returned by the configured boards', async () => {
  const boards = boardTokens('valid,offline,../unsafe,valid');
  assert.deepEqual(boards, ['valid', 'offline']);
  const source = await currentJobs(boards, async url => {
    if (url.includes('/offline/')) return new Response('', {status: 503});
    return Response.json({jobs: [
      {id: 123, title: 'Platform Architect', location: {name: 'Cairo'}, content: '&lt;p&gt;Platform engineering and architecture&lt;/p&gt;'},
      {id: 321, title: 'Retail Associate', location: {name: 'London'}, content: '<p>Stock inventory</p>'},
    ]});
  });
  assert.deepEqual(source.checked, ['valid']);
  const jobs = shortlistJobs(source.jobs, 'CTO with platform engineering and architecture experience', 'Cairo');
  assert.deepEqual(jobs.map(job => job.id), ['valid/123']);
  const matches = attachVerifiedJobs([
    {id: 'invented/456', score: 99},
    {id: 'valid/321', score: 98},
    {id: 'valid/123', score: 92, evidence: 'Platform architecture', gap: 'Team scope'},
    {id: 'valid/123', score: 60},
  ], jobs);
  assert.deepEqual(matches.map(match => [match.score, match.url]), [[92, 'https://job-boards.greenhouse.io/valid/jobs/123']]);
});
