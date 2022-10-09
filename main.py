def on_button_pressed_ab():
    global repCounter, calibrated, repTotalCount
    if calibrated == True:
        radio.send_value("Start", 1)
        repCounter = 1
    elif repTotalCount > 0:
        radio.send_value("Cali", 1)
input.on_button_pressed(Button.AB, on_button_pressed_ab)

def on_received_value(name, value):
    global exerciseNo, Nodes_RepCounter_Register, Nodes_Register, repTotalCount, nextRepCount, repCounter, init
    idx = -1
    sn = radio.received_packet(RadioPacketProperty.SERIAL_NUMBER)
    # Index ENUM: LH, RH, W, LL, RL,
    if name == "Reps":
        repTotalCount = value
    elif name == "PR" :
        pass
    elif name == "Ex":
        exerciseNo = value
    elif name == "LH":
        idx = 0
        init = True
    elif name == "RH":
        idx = 1
        init = True
    elif name == "W":
        idx = 2
        init = True
    elif name == "LL":
        idx = 3
        init = True
    elif name == "RL":
        idx = 4
        init = True
    elif name == "RC":

        if repCounter <= repTotalCount:
            idx = -1
            if sn == Nodes_Register[0]:
                idx = 0
            elif sn == Nodes_Register[1]:
                idx = 1
            elif sn == Nodes_Register[2]:
                idx = 2
            elif sn == Nodes_Register[3]:
                idx = 3
            elif sn == Nodes_Register[4]:
                idx = 4

            Nodes_RepCounter_Register[idx] = value
            nextRepCount = repCounter + 1
            proceedToNextRep = True
            
            for counter in Nodes_RepCounter_Register:
                if proceedToNextRep == True and counter == 0: # 0 meaning no input -> Ignore
                    proceedToNextRep = True
                elif proceedToNextRep == True and counter < nextRepCount:
                    proceedToNextRep = False
            # if all nodes says ok to proceed, go to next rep
            if proceedToNextRep == True:
                repCounter = Nodes_RepCounter_Register[0]
                basic.show_number(repCounter)
                if nextRepCount <= repTotalCount:
                    radio.send_value("RepNo", repCounter)
        else:
            radio.send_value("End", 1)

    if init == True:
        Nodes_Register[idx] = value
        Nodes_RepCounter_Register[idx] = 1

radio.on_received_value(on_received_value)

def on_received_string(receivedString):
    global exerciseNo, repCounter
    idx = -1 
    sn = radio.received_packet(RadioPacketProperty.SERIAL_NUMBER)
    # Index ENUM: LH, RH, W, LL, RL,
    if sn == Nodes_Register[0]:
        idx = 0
    elif sn == Nodes_Register[1]:
        idx = 1
    elif sn == Nodes_Register[2]:
        idx = 2
    elif sn == Nodes_Register[3]:
        idx = 3
    elif sn == Nodes_Register[4]:
        idx = 4

    #if idx != -1 and calibrated == True:         
    #   publishMsg(sn, exerciseNo, repCounter, receivedString, Nodes_Topic_Register[idx])
                    
radio.on_received_string(on_received_string)
def publishMsg(sn2: number, recvExNo2: number, recvRepNo2: number, recvMsg: str, topic2: str):
    global transmissionMsg
    transmissionMsg = "E=" + str(recvExNo2) + "&R=" + str(recvRepNo2) + "&" + recvMsg
    if ESP8266_IoT.is_mqtt_broker_connected():
        ESP8266_IoT.publish_mqtt_message(transmissionMsg, topic2, ESP8266_IoT.QosList.QOS0)
        pause(1000) #dont spam encounter 021
        basic.show_string("T")
        #basic.show_string(transmissionMsg)
        #basic.show_string(topic2)

init = False
transmissionMsg = ""
exerciseNo = 0
nextRepCount = 0
repTotalCount = 0
repCounter = 0
Nodes_RepCounter_Register: List[number] = []
Nodes_Register: List[number] = []
Nodes_Topic_Register: List[str] = []
radio.set_group(98)
calibrated = False
#radio.set_transmit_serial_number(True)
Nodes_Register = [0, 0, 0, 0, 0]
Nodes_RepCounter_Register = [0, 0, 0, 0, 0]
Nodes_Topic_Register = ["IoTRHB/LH", "IoTRHB/RH", "IoTRHB/W", "IoTRHB/LL", "IoTRHB/RL"]
ESP8266_IoT.init_wifi(SerialPin.P8, SerialPin.P12, BaudRate.BAUD_RATE115200)
ESP8266_IoT.connect_wifi("AlanderC", "@landeR$q")
if ESP8266_IoT.wifi_state(True):
    ESP8266_IoT.set_mqtt(ESP8266_IoT.SchemeList.TCP, "ACSQ", "", "", "")
    ESP8266_IoT.connect_mqtt("broker.hivemq.com", 1883, True)

def on_forever():
    global calibrated, init
    # Index ENUM: LH, RH, W, LL, RL
    if calibrated == False and Nodes_Register[0] > 0 and Nodes_Register[1] > 0: #and Nodes_Register[2] > 0 and Nodes_Register[3] > 0 and Nodes_Register[4] > 0:
        calibrated = True
        init = False

    elif calibrated == True:
        basic.show_string("S")

    elif repTotalCount > 0:
        basic.show_string("R")
        
    if ESP8266_IoT.wifi_state(True):
        if ESP8266_IoT.is_mqtt_broker_connected():
            basic.show_string("C")

basic.forever(on_forever)
