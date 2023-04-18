const axios = require('axios');
const fs = require('fs');
const csv = require('csv-writer').createObjectCsvWriter;

const projectId = '44078071';
const startDate = '2023-03-01T00:00:00Z';
const endDate = '2023-03-21T23:59:59Z';
const privateToken = 'glpat-m_btkx8x7_-A456fT1aN';
const csvFilePath = 'merge_request_comments.csv';

const apiEndpoint = `https://gitlab.com/api/v4/projects/${projectId}/merge_requests?created_after=${startDate}&created_before=${endDate}`;

axios.get(apiEndpoint, {
  headers: {
    'PRIVATE-TOKEN': privateToken
  }
})
  .then(async (response) => {
    const mergeRequests = response.data;
    const csvWriter = csv({
      path: csvFilePath,
      header: [
        { id: 'merge_request_id', title: 'Merge Request ID' },
        { id: 'merge_request_title', title: 'Merge Request Title' },
        { id: 'comment_author', title: 'Comment Author' },
        { id: 'comment_body', title: 'Comment Body' }
      ]
    });

    const csvRecords = [];

    for (const mergeRequest of mergeRequests) {
      const notesEndpoint = `https://gitlab.com/api/v4/projects/${projectId}/merge_requests/${mergeRequest.iid}/notes`;
      const notesResponse = await axios.get(notesEndpoint, {
        headers: {
          'PRIVATE-TOKEN': privateToken
        }
      });

      const comments = notesResponse.data;
      for (const comment of comments) {
        const record = {
          merge_request_id: mergeRequest.iid,
          merge_request_title: mergeRequest.title,
          comment_author: comment.author.name,
          comment_body: comment.body
        };
        csvRecords.push(record);
      }
    }

    csvWriter.writeRecords(csvRecords)
      .then(() => console.log(`Merge request comments saved to ${csvFilePath}`))
      .catch((error) => console.error(error));
  })
  .catch((error) => {
    console.error(error);
  });
