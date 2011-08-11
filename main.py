import tornado.ioloop
import tornado.web
import feedparser
import json

class MyJsonEncoder(json.JSONEncoder):
	def default(self, obj):
		if isinstance(obj, time.struct_time):
			return list(obj)
		return json.JSONEncoder.default(self, obj)


class MainHandler(tornado.web.RequestHandler):
	def get(self):
		cui_url = "http://nna:nxnxnx@cuicui.zenexity.com/api/statuses/public_timeline.atom"
	
		feed = feedparser.parse( cui_url )

		self.write(MyJsonEncoder().encode(feed))

application = tornado.web.Application([
	(r"/", MainHandler),
])

if __name__ == "__main__":
	application.listen(8888)
	tornado.ioloop.IOLoop.instance().start()