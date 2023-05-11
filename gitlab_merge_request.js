const axios = require('axios');
const fs = require('fs');
const csv = require('csv-writer').createObjectCsvWriter;
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the project ID: ', (projectId) => {
  rl.question('Enter the start date (YYYY-MM-DD): ', (startDate) => {
    rl.question('Enter the end date (YYYY-MM-DD): ', (endDate) => {
      rl.question('Enter your GitLab private token: ', (privateToken) => {

        const csvFilePath = 'merge_request_comments.csv';

        const apiEndpoint = `https://gitlab.com/api/v4/projects/${projectId}/merge_requests?created_after=${startDate}T00:00:00Z&created_before=${endDate}T23:59:59Z`;

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
                { id: 'merge_request_id', title: 'Merge_Request_ID' },
                {id:'merge_date',title:'Merged_At'},
                { id: 'merge_request_title', title: 'Merge_Request_Title' },
                { id: 'comment_author', title: 'Comment_Author'},
                { id: 'comment_date', title: 'Comment_At' },
                { id: 'comment_body', title: 'Comment_Body' },
                { id: 'commit_author', title: 'Commit_Author' },
                { id : 'reviewer',title:'Reviewer'},
                { id: 'commit_diff', title: 'Difference'}
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

              const diffEndpoint = `https://gitlab.com/api/v4/projects/${projectId}/merge_requests/${mergeRequest.iid}/diffs`;
              const diffResponse = await axios.get(diffEndpoint, {
                headers: {
                  'PRIVATE-TOKEN': privateToken
                }
              });

              const comments = notesResponse.data;
              const diffs = diffResponse.data;

              for (const comment of comments) {
                for(const diff of diffs) {
                  if (comment["system"] === false) {
                    // console.log(comment);
                    const record = {
                      merge_request_id: mergeRequest.iid,
                      merge_request_title: mergeRequest.title,
                      commit_author:mergeRequest.author.name,
                      comment_author: comment.author.name,
                      reviewer:mergeRequest.merge_user.name,
                      comment_body: comment.body,
                      comment_date:comment.updated_at,
                      merge_date:mergeRequest.merged_at,
                      commit_diff: diff.diff
                    };
                    csvRecords.push(record);
                  }
                }
              }
            }

            csvWriter.writeRecords(csvRecords)
              .then(() => console.log(`Merge request comments saved to ${csvFilePath}`))
              .catch((error) => console.error(error));

            rl.close();
          })
          .catch((error) => {
            console.error(error);
            rl.close();
          });
      });
    });
  });
});
