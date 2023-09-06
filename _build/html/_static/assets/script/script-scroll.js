function scroll(element, speed) {
    var distance = element.height();
    var duration = distance / speed;
    element.animate({scrollTop: distance}, duration, 'linear');
}

$(document).ready(function() {
    $("button").click(function() {
        scroll($("html, body"), 0.1); // Set as required
    });
});
