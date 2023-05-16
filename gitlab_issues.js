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

        const csvFilePath = 'issues.csv';

        const apiEndpoint = `https://gitlab.com/api/v4/projects/${projectId}/issues?created_after=${startDate}T00:00:00Z&created_before=${endDate}T23:59:59Z`;

        axios.get(apiEndpoint, {
          headers: {
            'PRIVATE-TOKEN': privateToken
          }
        })
          .then(async (response) => {

            const issues = response.data;
            const csvWriter = csv({
              path: csvFilePath,
              header: [
                { id: 'issue_id', title: 'Issue_ID' },
                { id: 'issue_title', title: 'Issue_Title' },
                { id: 'comment_author', title: 'Comment_Author' },
                { id: 'comment_date', title: 'Comment_At' },
                { id: 'comment_body', title: 'Comment_Body' },
                { id: 'commit_author', title: 'Commit_Author' },
                { id: 'reviewer', title: 'Assignees' }
              ]
            });

            const csvRecords = [];
            for (const issue of issues) {
              const notesEndpoint = `https://gitlab.com/api/v4/projects/${projectId}/issues/${issue.iid}/notes`;
              const notesResponse = await axios.get(notesEndpoint, {
                headers: {
                  'PRIVATE-TOKEN': privateToken
                }
              });
              const comments = notesResponse.data;
              let assignees = '';
              for (const comment of comments) {

                if (comment["system"] === false) {
                  assignees = issue.assignees[0].name;
                  for (let i = 1; i < issue.assignees.length; i++) {
                    assignees = assignees + ',' + issue.assignees[i].name
                  }
                  const record = {
                    issue_id: issue.iid,
                    issue_title: issue.title,
                    commit_author: issue.author.name,
                    comment_author: comment.author.name,
                    reviewer: assignees,
                    comment_body: comment.body,
                    comment_date: comment.updated_at,
                  };
                  csvRecords.push(record);
                }
              }
            }

            csvWriter.writeRecords(csvRecords)
              .then(() => console.log(`Issue comments saved to ${csvFilePath}`))
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
