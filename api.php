<?php

/**
 * Zeigt an, welche Datei den Aufruf behandelt.
 */
define("MP_ALLOWED", "api.php");

header("Content-Type: application/json;charset=utf8");
$request = null;
$request = json_decode(file_get_contents("php://input"), true);

if ($request == null) {
  echo '{"version":2,"log":[]}';
  exit;
}

if (@$request["version"] != 2) {
  echo '{"version":2,"log":[],"error":"Error 400: Specified version is not supported!"}';
  exit;
}

$response = [
  "version" => 2,
  "function" => @$request["function"],
  "log" => []
];

switch (@$request["function"]) {
  case "is_connected":
    if (
      empty(@$request["token"]) ||
      empty(@$request["id"])
    ) {
      $response["return"] = false;
    } else {
      $response["return"] = true;
    }
    echo json_encode($response);
    exit;
    break;
  case "get_lessons":
    $response["return"] = get_lessons();
    break;
  case "get_lesson":
    $response["return"] = get_lesson($request["arguments"][0]);
    break;
  default:
    break;
}

echo json_encode($response);

function get_lessons() {
  $json = [];
  if ($handle = opendir('./voc-list')) {
    while (false !== ($entry = readdir($handle))) {
      $match = [];
      if (preg_match("/^lesson-0*([1-9][0-9]*)\.txt$/", $entry, $match)) {
        $json[] = (int)$match[1];
      }
    }
    closedir($handle);
  }
  return $json;
}

function get_lesson(string $lesson) {
  if (
    preg_match("/^[0-9]+$/", $lesson) &&
    ($lesson < 10 ? is_file("./voc-list/lesson-0$lesson.txt") : is_file("./voc-list/lesson-$lesson.txt"))
  ) {
    return file_get_contents(($lesson < 10 ? "./voc-list/lesson-0$lesson.txt" : "./voc-list/lesson-$lesson.txt"));
  }
  return false;
}
