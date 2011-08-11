package controllers;

import play.*;
import play.libs.WS;
import play.libs.WS.WSRequest;
import play.mvc.*;

import java.util.*;

import models.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;

import com.google.gson.Gson;

public class Application extends Controller {

    public static void index() {
        render();
        
    }
}