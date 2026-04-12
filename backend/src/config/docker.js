import Docker from "dockerode";

let docker;

if (process.platform === "win32") {
  docker = new Docker({
    socketPath: "//./pipe/dockerDesktopLinuxEngine",
  });
} else {
  docker = new Docker({
    socketPath: "/var/run/docker.sock",
  });
}

export default docker;
