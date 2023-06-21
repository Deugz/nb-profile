// init player
function onYouTubeIframeAPIReady() {
	player = new YT.Player('stickyAnchor', {
		videoId: 'qxuu5CwGTlM',
		events: {
			'onReady': onPlayerReady
		}
	});
}
function onPlayerReady(event) {
	var player = event.target;
	iframe = $('#stickyAnchor');
	console.log(player.getCurrentTime());
	setupListener(); 
}
function setupListener (){
	$(window).scroll(playTime);
}

var videoSrc = $('.v-page-anchor').attr('src');
$('body').prepend('<div id="sticky-video"><div class="video-container"><iframe id="playerSource" src="" frameborder="0"/></div></div>').find('#sticky-video iframe').attr('src', videoSrc);

function playTime() {
	var stickytime = Math.round(player.getCurrentTime());
	var video = $('.v-page-anchor');
	var vidHeight = video.height();
	var videoInView = video.offset().top + vidHeight;
	var top = $(window).scrollTop();
	if (top >= videoInView) {
		var currentParam = $('#playerSource').attr('src');
		$('#sticky-video').css('transform', 'translateY(0)');
	} else {
		$('#sticky-video').css('transform', 'translateY(-100%)')
	}
}


// $(window).scroll(function() {

// });