document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox', ''));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent', ''));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive', ''));
  document.querySelector('#compose').addEventListener('click', () => compose_email(''));

  // By default, load the inbox
  load_mailbox('inbox', '');

  // use submit button to send email
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  
  // if you click on an email
  document.querySelector('#emails-view').addEventListener('click', (event) => {
    if (event.target.classList.contains('email-box')) {
      const emailId = event.target.dataset.id;
      view_email(event, emailId);
    }
  });


  function compose_email(message) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#single-email').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    // use submit button to send email
    document.querySelector('#compose-form').addEventListener('submit', send_email);

    // document.querySelector('#message').innerHTML = message;
  }

  function load_mailbox(mailbox, message) {
    
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#single-email').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    document.querySelector('#emails-view').append(message)

    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {

      console.log(emails)

      emails.forEach(email => {

        const email_box = document.createElement('div');
        email_box.setAttribute("class", "email-box");
        email_box.setAttribute('data-id', `${email.id}`)
        email_box.innerHTML = `sender: ${email.sender} subject: ${email.subject} time: ${email.timestamp} ` ;
        document.querySelector('#emails-view').append(email_box);

        if (email.read) {
          email_box.style.backgroundColor = 'lightgray';
        } else {
          email_box.style.backgroundColor = 'white';
        }

      });

    })  

  }

  

  function send_email(event) {
    event.preventDefault();
    fetch('/emails', {
      method: 'POST', 
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value, 
        subject: document.querySelector('#compose-subject').value, 
        body: document.querySelector('#compose-body').value,
      })
    })
    .then(response => response.json())
    .then(result => {
      const message = document.createElement('div');
      message.setAttribute('id', 'message')
      if (result.message){
        message.innerHTML = result.message;
        load_mailbox('sent', message);
      } else {
        message.innerHTML = result.error;
        document.querySelector('#compose-view').append(message)
      }
    });
  }

  function view_email(event, email_id) {
    event.preventDefault();

    // set email attribute read to True with put request
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#single-email').style.display = 'block';

    // Show the mailbox name

    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      // Print email
      console.log(email);

      // if the arch_button exists remove it
      // document.querySelector('archive').remove()

      // document.querySelector('#single-email').innerHTML = `Email Page`;
      document.querySelector('#from').innerHTML = `From: ${email.sender}`;
      document.querySelector('#title').innerHTML = `Subject: ${email.subject}`;
      document.querySelector('#to').innerHTML = `To: ${email.recipients}`;
      document.querySelector('#time').innerHTML = `Time: ${email.timestamp}`;
      document.querySelector('#body').innerHTML = `Body: ${email.body}`;    

      const user = document.querySelector('#user').innerHTML;
      console.log(`user: ${user}`)

      const arch_button = document.querySelector('.archive'); 
      if (user !== email.sender) {
        console.log(user, email.sender)
        if (email.archived === false){
          arch_button.innerHTML = 'Archive';
          arch_button.onclick = async () => {
            await fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: true
              })
            })
            await (load_mailbox('archive', 'Email is archived'))
          }
        } else {
          arch_button.innerHTML = 'Unarchive';
          arch_button.onclick = async () => {
            await fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false,
              })
            })
            await (load_mailbox('inbox', 'Email is un-archived'));
          }
        }
      } else {
          arch_button.style.display = 'none';
      }

      document.querySelector('#reply').addEventListener('click', (event) => {
        event.preventDefault();
        reply(email.id);
      });

    });

  }

  function reply(email_id) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#single-email').style.display = 'none';

    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {    // Clear out composition fields
      
      document.querySelector('#compose-recipients').value = `${email.sender}`;
      
      let subject = email.subject
      if (subject.split(" ")[0] != "Re:"){
        subject = `Re: ${email.subject}`
      }
      
      document.querySelector('#compose-subject').value = `${subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n\n${email.body}`;
    
    })
  }

})