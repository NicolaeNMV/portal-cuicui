package controllers;

import play.*;
import play.cache.Cache;
import play.libs.WS;
import play.libs.XPath;
import play.libs.WS.WSRequest;
import play.mvc.*;
import utils.pusher.Pusher;

import java.util.*;

//import models.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.io.IOException;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import com.google.gson.Gson;


public class Cuicui extends Controller {

    public static void index() {
        render();
    }
    
    public static void rssJsonp(String jsonp,String latest) throws SAXException, IOException, ParserConfigurationException {
    	Map<String,String> result = new HashMap<String, String>();
    	
    	// Give the xml only if user doesnt have the lastest version
    	if ( latest != null && latest.equals(latest(true)) ) {
        	result.put("youHaveLatest","true");
    	} else {
        	result.put("xml", getRss(true,1));
        	result.put("youHaveLatest","false");
    	}
    	
    	renderText(jsonp+"("+new Gson().toJson(result)+");");
    }
    
    public static void rssPageJsonp(String jsonp,Integer page) throws SAXException, IOException, ParserConfigurationException {
    	Map<String,String> result = new HashMap<String, String>();
    	
        result.put("xml", getRss(true,page));
        result.put("youHaveLatest","false");
    	
    	renderText(jsonp+"("+new Gson().toJson(result)+");");
    }
    
    private static String getRss(Boolean cache,Integer page) {
    	if (page == null) page = 1;
    	String xml = Cache.get("cuirss"+page,String.class);
    	if (cache == false || xml == null) {
        	xml = WS.url("http://cuicui.zenexity.com/api/statuses/public_timeline.atom").setParameter("page", page).authenticate(Play.configuration.getProperty("cuicui.username"),Play.configuration.getProperty("cuicui.password")).get().getString();
        	Cache.set("cuirss"+page, xml, "30s");
    	}
    	return xml;
    }
    
    public static void ping() throws SAXException, IOException, ParserConfigurationException {
    	Map<String,String> result = new HashMap<String, String>();
    	result.put("latest",latest(false));
    	Pusher.triggerPush("cuicui", "pong", new Gson().toJson(result).toString());
    }
    
    private static String latest(Boolean cache) throws SAXException, IOException, ParserConfigurationException {
		DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
		Document document;
		
		document = dbf.newDocumentBuilder().parse(new InputSource(new ByteArrayInputStream( getRss(cache,1).getBytes() )));
		List<Node> tradeItemNodes = XPath.selectNodes("//entry", document);
		return XPath.selectText("published", tradeItemNodes.get(0));
    }
}