const { App } = require('@slack/bolt');
const axios = require('axios');

// Initialize the Slack App
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

// Global Admin Password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Handle Slack's URL verification challenge (add this part)
app.post('/slack/events', (req, res) => {
    if (req.body.type === 'url_verification') {
      res.status(200).send(req.body.challenge); // Respond with the challenge parameter
    } else {
      res.status(200).send(); // For other event types, acknowledge the request
    }
  });

// Welcome message on user join
app.event('team_join', async ({ event, client }) => {
  const randomMessages = [
    `Welcome to the team, <@${event.user.id}>! 💪 We're thrilled to have you here!`,
    `<@${event.user.id}> just joined! 🎉 Let's give them a warm welcome!`,
    `Hey <@${event.user.id}>, welcome aboard! 🚀 You're going to crush it here!`
  ];
  const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];

  try {
    await client.chat.postMessage({
      channel: 'C088KMPTFKP',
      text: message,
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

// Slash command for admin actions
app.command('/admin', async ({ command, ack, say }) => {
  await ack();
  if (command.text.trim() !== ADMIN_PASSWORD) {
    await say('❌ Incorrect password. Please try again.');
    return;
  }

  await say({
    text: "Admin Actions:",
    attachments: [
      {
        text: "Choose an action:",
        fallback: "Admin actions",
        callback_id: "admin_actions",
        actions: [
          { name: "broadcast", text: "Broadcast Message", type: "button", value: "broadcast" },
          { name: "create_channel", text: "Create Channel", type: "button", value: "create_channel" },
          { name: "delete_channel", text: "Delete Channel", type: "button", value: "delete_channel" }
        ]
      }
    ]
  });
});

// Broadcast messages
app.action('broadcast', async ({ ack, body, client }) => {
  await ack();
  try {
    await client.chat.postMessage({
      channel: body.user.id,
      text: "Please specify the audience (people or channel ID), the message, and confirm the broadcast.",
    });
  } catch (error) {
    console.error('Error initializing broadcast:', error);
  }
});

// Create a new channel
app.action('create_channel', async ({ ack, body, client }) => {
  await ack();
  try {
    await client.chat.postMessage({
      channel: body.user.id,
      text: "Please specify the channel name, type (public/private), and confirm the creation.",
    });
  } catch (error) {
    console.error('Error initializing channel creation:', error);
  }
});

// Delete a channel
app.action('delete_channel', async ({ ack, body, client }) => {
  await ack();
  try {
    await client.chat.postMessage({
      channel: body.user.id,
      text: "Please specify the channel ID to delete and confirm the deletion.",
    });
  } catch (error) {
    console.error('Error initializing channel deletion:', error);
  }
});

// Send a motivational quote
async function fetchQuote() {
  try {
    const response = await axios.get('https://zenquotes.io/api/random');
    return response.data[0].q + " - " + response.data[0].a;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return "Keep pushing forward! 💪";
  }
}

// Idea Submission
app.command('/start-idea', async ({ command, ack, client }) => {
    await ack();
    try {
      // DM the user a form to gather idea details
      await client.chat.postMessage({
        channel: command.user_id,
        text: "Let's gather some details about your idea! 💡 Please provide the following information:",
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: "What's your idea about? (Give a short description)" },
            accessory: {
              type: "plain_text_input",
              action_id: "idea_description",
              placeholder: { type: "plain_text", text: "Enter a short description" },
            },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: "Who will benefit from this idea?" },
            accessory: {
              type: "plain_text_input",
              action_id: "idea_audience",
              placeholder: { type: "plain_text", text: "Describe the audience" },
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Submit Idea" },
                style: "primary",
                action_id: "submit_idea",
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error starting idea submission:', error);
    }
  });
  
  // Handle idea submission
  app.action('submit_idea', async ({ body, ack, client }) => {
    await ack();
    const userId = body.user.id;
    const description = body.state.values.idea_description.value;
    const audience = body.state.values.idea_audience.value;
  
    const message = `New Idea from <@${userId}>:\n*Description:* ${description}\n*Audience:* ${audience}`;
    
    try {
      await client.chat.postMessage({
        channel: 'C088NKP5A6N',
        text: message,
      });
  
      // Confirm with the user
      await client.chat.postMessage({
        channel: userId,
        text: "✅ Your idea has been submitted successfully!",
      });
    } catch (error) {
      console.error('Error handling idea submission:', error);
    }
  });
  
  // Social Post Validation
  app.command('/social-post', async ({ command, ack, client }) => {
    await ack();
    try {
      // DM the user a form for social post validation
      await client.chat.postMessage({
        channel: command.user_id,
        text: "Let's gather some details for the social post! 📲",
        blocks: [
          {
            type: "input",
            block_id: "social_title",
            element: {
              type: "plain_text_input",
              action_id: "title_input",
            },
            label: {
              type: "plain_text",
              text: "Title",
            },
          },
          {
            type: "input",
            block_id: "social_description",
            element: {
              type: "plain_text_input",
              action_id: "description_input",
            },
            label: {
              type: "plain_text",
              text: "Description",
            },
          },
          {
            type: "input",
            block_id: "social_platforms",
            element: {
              type: "checkboxes",
              action_id: "platforms_input",
              options: [
                { text: { type: "plain_text", text: "TikTok" }, value: "tiktok" },
                { text: { type: "plain_text", text: "Instagram" }, value: "instagram" },
              ],
            },
            label: {
              type: "plain_text",
              text: "Platforms",
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Submit Post" },
                style: "primary",
                action_id: "submit_social_post",
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error starting social post validation:', error);
    }
  });
  
  // Handle social post submission
  app.action('submit_social_post', async ({ body, ack, client }) => {
    await ack();
    const userId = body.user.id;
    const state = body.state.values;
  
    const title = state.social_title.title_input.value;
    const description = state.social_description.description_input.value;
    const platforms = state.social_platforms.platforms_input.selected_options
      .map(option => option.text.text)
      .join(', ');
  
    const caseId = Math.random().toString(36).substring(2, 10).toUpperCase();
  
    try {
      // DM the user
      await client.chat.postMessage({
        channel: userId,
        text: `✅ Your social post has been submitted!\n\n*Title:* ${title}\n*Description:* ${description}\n*Platforms:* ${platforms}\n*Case ID:* ${caseId}\n\nPlease send your video or photo in this thread.`,
      });
  
      // Notify in the Social Post Channel
      await client.chat.postMessage({
        channel: 'C089BE0DJL8',
        text: `New Social Post Submission:\n*Title:* ${title}\n*Description:* ${description}\n*Platforms:* ${platforms}\n*Submitted by:* <@${userId}>\n*Case ID:* ${caseId}\n\nPlease upload the post materials in this thread.`,
        attachments: [
          {
            text: "Approve or Decline the submission:",
            fallback: "Approve or Decline",
            callback_id: "social_post_review",
            actions: [
              {
                name: "approve",
                text: "Approve",
                type: "button",
                value: `approve_${caseId}`,
                style: "primary",
              },
              {
                name: "decline",
                text: "Decline",
                type: "button",
                value: `decline_${caseId}`,
                style: "danger",
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error submitting social post:', error);
    }
  });

  // Listen for messages in the submitter's thread
app.message(async ({ message, client }) => {
    // Check if the message is in a thread and has a Case ID
    if (message.thread_ts && message.text && message.channel_type === 'im') {
      const caseIdMatch = message.text.match(/Case ID: ([A-Z0-9]+)/i);
  
      if (caseIdMatch) {
        const caseId = caseIdMatch[1];
  
        try {
          // Find the thread in the Social Post Channel
          const result = await client.conversations.history({
            channel: 'C089BE0DJL8',
            latest: message.thread_ts,
            inclusive: true,
            limit: 1,
          });
  
          const threadMessage = result.messages[0];
  
          if (threadMessage && threadMessage.text.includes(`*Case ID:* ${caseId}`)) {
            // Post the message in the corresponding thread in the Social Post Channel
            await client.chat.postMessage({
              channel: 'C089BE0DJL8',
              thread_ts: threadMessage.ts,
              text: `<@${message.user}> sent the following:`,
              attachments: [
                {
                  text: message.text,
                },
              ],
            });
          }
        } catch (error) {
          console.error('Error syncing thread message from submitter:', error);
        }
      }
    }
  });
  
  // Listen for messages in the Social Post Channel thread
  app.message(async ({ message, client }) => {
    // Check if the message is in a thread and has a Case ID
    if (message.thread_ts && message.channel === 'C089BE0DJL8') {
      const caseIdMatch = message.text.match(/Case ID: ([A-Z0-9]+)/i);
  
      if (caseIdMatch) {
        const caseId = caseIdMatch[1];
  
        try {
          // DM the submitter with the message from the thread
          const threadMessage = await client.conversations.history({
            channel: message.channel,
            latest: message.thread_ts,
            inclusive: true,
            limit: 1,
          });
  
          const submitterMatch = threadMessage.messages[0]?.text.match(/<@([A-Z0-9]+)>/);
  
          if (submitterMatch) {
            const submitterId = submitterMatch[1];
  
            await client.chat.postMessage({
              channel: submitterId,
              text: `In the thread for your submission (*Case ID:* ${caseId}), someone said:`,
              attachments: [
                {
                  text: message.text,
                },
              ],
            });
          }
        } catch (error) {
          console.error('Error syncing thread message to submitter:', error);
        }
      }
    }
  });
  
  
  // Approve or Decline Social Post
  app.action(/(approve|decline)_(.+)/, async ({ body, ack, client, action }) => {
    await ack();
    const [decision, caseId] = action.value.split('_');
    const userId = body.user.id;
  
    const status = decision === 'approve' ? 'Approved' : 'Declined';
    const color = decision === 'approve' ? 'good' : 'danger';
  
    try {
      // Notify the user who submitted the form
      await client.chat.postMessage({
        channel: body.user.id,
        text: `Your submission with Case ID *${caseId}* has been *${status}*.`,
      });
  
      // Update the thread in the Social Post Channel
      await client.chat.postMessage({
        channel: body.channel.id,
        thread_ts: body.message.ts,
        text: `<@${userId}> has *${status}* the submission with Case ID *${caseId}*.`,
        attachments: [
          {
            color,
            text: `${status} by <@${userId}>`,
          },
        ],
      });
    } catch (error) {
      console.error('Error processing review:', error);
    }
  });
  

app.message('send motivational quote', async ({ message, say }) => {
  const quote = await fetchQuote();
  await say({
    channel: 'C088R5BN8AY',
    text: quote,
  });
});

// Start the app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack bot is running!');
})();
