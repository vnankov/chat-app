const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const urlLocation = document.querySelector("#location").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeigh = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scroll
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeigh <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(urlLocation, {
    username: message.username,
    url: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // disable
  $messageFormButton.setAttribute("disabled", "disabled");

  const inputValue = e.target.elements.message.value;
  socket.emit("sendMessage", inputValue, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    // enable

    if (error) {
      return console.log(error);
    }

    console.log("Message delivered!");
  });
});

$sendLocationButton.addEventListener("click", () => {
  //disable
  $sendLocationButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (message) => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("Shared location", message);
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
});
