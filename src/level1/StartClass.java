package level1;

import com.google.gson.JsonObject;
import level2.consolidator.Consolidator;
import level2.web.HttpHandlerController;

public class StartClass {

    JsonObject storageToJson(){
        return null;
    }

    void build(JsonObject buildData){
        //delete old storage
        //put new storage data
        // from app/package.json
        //run build
    }

    public static void main(String[] args) {
        for (int i = 0; i <10; i++) {
            Consolidator.getInstance().actions.eventsGroup.arrayCountersCash.put("actionID" + i, Double.valueOf(i));
        }
        HttpHandlerController httpHandlerController = new HttpHandlerController();
    }
}
