package com.example.notepad;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLConnection;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.util.EntityUtils;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.AsyncTask;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import android.widget.Toast;


public class MetaAdapter extends ArrayAdapter {
	Context context;
	
	public MetaAdapter(Context context, int resource) {
		super(context, resource);
		this.context = context;
	}

	@Override
	public View getView(int position, View convertView, ViewGroup parent) {
		LayoutInflater inflater = (LayoutInflater)context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		View row = inflater.inflate(R.layout.list_item, parent, false);
		
		TextView textView = (TextView)row.findViewById(R.id.textView1);
		textView.setTag("http://178.124.178.151/!hello");
		new DownloadNode().execute(textView);
		return row;
	}

	@Override
	public int getCount() {
		return 30;
	}
	
	
	class DownloadNode extends AsyncTask<Object, Void, String>{

		TextView textView;

        @Override
        protected String doInBackground(Object... params) {
        	textView = (TextView)params[0];
        	try
        	{
				URLConnection conn = new URL(textView.getTag().toString()).openConnection();
				BufferedReader buf = new BufferedReader(new InputStreamReader(conn.getInputStream()));
				return buf.readLine();
    		}catch (Exception e)
    		{Log.i("GET RESPONSE", "Error " + e.getMessage());}
        	
            
			return null;
        }
        
		@Override
		protected void onPostExecute(String result) {
			super.onPostExecute(result);
			textView.setText(result);
		}
    }


	final String FileName = "file";
	  
	  void writeFile() throws IOException {
				FileWriter file = new FileWriter(FileName);
				file.write("123"); 
				file.close();
		  }

		  void readFile() throws IOException {
		    	String str = "";
		    	BufferedReader buf = new BufferedReader(new FileReader(FileName));
		    	while ((str = buf.readLine()) != null) 
			        Log.d("Adapter", str); 
		    	buf.close();
		  }

}