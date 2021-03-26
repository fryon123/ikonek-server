$(document).ready(function() {
  $("#hireButton").click(function() {
    console.log($("#name").text());
    $.get("/users/" + $("#name").html().toLowerCase(), function(data, status) {
      $.post("/messages/push", { number: data.number.toString(), password: "FRYON"}, function(
        data,
        status
      ) {
          alert(status);
      });
    });
  });
});
