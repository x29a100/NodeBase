unit Unit1;

interface

uses
  Windows, Messages, SysUtils, Variants, Classes, Graphics, Controls, Forms,
  Dialogs, StdCtrls, IdBaseComponent, IdComponent, IdTCPConnection,
  IdTCPClient, IdHTTP, ExtCtrls, TlHelp32, PsAPI, IniFiles, xmldom, XMLIntf, msxmldom, XMLDoc,
  IdTCPServer, IdCustomHTTPServer, IdHTTPServer, ActiveX, uLkJSON;

type
  TForm1 = class(TForm)
    Label1: TLabel;
    IdHTTPServer1: TIdHTTPServer;
    procedure IdHTTPServer1CommandGet(AThread: TIdPeerThread;
      ARequestInfo: TIdHTTPRequestInfo;
      AResponseInfo: TIdHTTPResponseInfo);
    procedure FormCreate(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  Form1:             TForm1;
  ProcessHandle:     THandle;
  ProcessExePath:    array[0..127] of Char;
  WindowExePath:     array[0..127] of Char;
  buff:              array[0..127] of Char;
  TheIcon:           TIcon;
  Domain, User :     array [0..50] of Char;
  ProcessID:         DWORD;
  chDomain,chUser :  Cardinal;
  ProcColor:         integer;
  pmc:               PPROCESS_MEMORY_COUNTERS;
  cb:                Integer;
  F:                 TIniFile;
  ProgCap:           string;
  hProcess:          THandle;
  hToken:            THandle;
  Priv,PrivOld:      TOKEN_PRIVILEGES;
  cbPriv:            DWORD;
  dwError:           DWORD;
  hSnapShot:         THandle;
  uProcess:          PROCESSENTRY32;
  r:                 longbool;
  KillProc:          DWORD;
  LvInx:             integer;
  FileDescription:   string;
  P:                 TPoint;
  MayClose:          boolean=false;
  fff:               TStringList ;
  df: string;


implementation

uses
 NTNative, ComObj;

{$R *.dfm}

function GetProcessCmdLine(PID:DWORD):string;
var
 hProcess:THandle;
 pProcBasicInfo:PROCESS_BASIC_INFORMATION;
 ReturnLength:DWORD;
 prb:PEB;
 ProcessParameters:PROCESS_PARAMETERS;
 cb:cardinal;
 ws:WideString;
begin
 result:='';
 if pid=0 then exit;
 hProcess:=OpenProcess(PROCESS_QUERY_INFORMATION or PROCESS_VM_READ, FALSE, PID);
 if (hProcess <> 0) then
 try
  if (NtQueryInformationProcess(hProcess,ProcessBasicInformation,
                               @pProcBasicInfo,
                               sizeof(PROCESS_BASIC_INFORMATION),@ReturnLength) = STATUS_SUCCESS) then
  begin
   if ReadProcessMemory(hProcess,pProcBasicInfo.PebBaseAddress,@prb,sizeof(PEB),cb) then
     if ReadProcessMemory(hProcess,prb.ProcessParameters,@ProcessParameters,sizeof(PROCESS_PARAMETERS),cb) then
     begin
       SetLength(ws,(ProcessParameters.CommandLine.Length div 2));
       if ReadProcessMemory(hProcess,ProcessParameters.CommandLine.Buffer,
                            PWideChar(ws),ProcessParameters.CommandLine.Length,cb) then
       result:=string(ws)
     end
  end
 finally
  closehandle(hProcess)
 end
end;

type
  TProcessEntry32List = array of TProcessEntry32;

function GetProcs(): TProcessEntry32List;
var
  hProcSnap: THandle;
  pe32: TProcessEntry32;
begin
  hProcSnap := CreateToolHelp32SnapShot(TH32CS_SNAPPROCESS, 0);
  if hProcSnap = INVALID_HANDLE_VALUE then exit;
  pe32.dwSize := SizeOf(ProcessEntry32);
  if Process32First(hProcSnap, pe32) = true then
    while Process32Next(hProcSnap, pe32) = true do
     begin
      ProcessHandle := OpenProcess(PROCESS_QUERY_INFORMATION or PROCESS_VM_READ, False,pe32.th32ProcessID );
       chDomain:=50;
        chUser :=50;
          GetModuleFileNameEx(ProcessHandle, 0, ProcessExePath,127);

      cb := SizeOf(_PROCESS_MEMORY_COUNTERS);
      GetMem(pmc, cb);
      pmc^.cb := cb;
      GetProcessMemoryInfo(ProcessHandle, pmc, cb);
      if  pmc^.PeakPagefileUsage <> 0 then
      begin
        SetLength(Result, High(Result) + 2);
        Result[High(Result)] := pe32;
      end;
    end;
  CloseHandle(hProcSnap);
  CloseHandle(ProcessHandle);
end;

procedure TForm1.IdHTTPServer1CommandGet(AThread: TIdPeerThread;
  ARequestInfo: TIdHTTPRequestInfo; AResponseInfo: TIdHTTPResponseInfo);
var
  ProcessList: TProcessEntry32List;
  i: Integer;
  Xml: IXMLDocument;
  list: TlkJSONlist;
  item: TlkJSONbase;
begin
  try
    item := TlkJSONbase.Create;
    item.Field['pid'].Value := 1024;
    item.Field['name'].Value := 'paint';
    item.Field['usage'].Value := 10;
    item.Field['memory'].Value := 150;
    list.Add(item);
    item := TlkJSONbase.Create;
    item.Field['pid'].Value := 1025;
    item.Field['name'].Value := 'word';
    item.Field['usage'].Value := 15;
    item.Field['memory'].Value := 200;
    list.Add(item);

    ShowMessage(list.Value);
    {CoInitialize(Nil);
    Xml := TXMLDocument.Create(nil);
    Xml.Active := true;
    with Xml do
    begin
      ProcessList := GetProcs();
      with AddChild ('table') do
      begin
      Attributes['id'] := 'list';
      for i:=0 to High(ProcessList) do
      begin
        with AddChild('tr') do
        begin
          with AddChild('td') do
          begin
            Text := IntToStr(ProcessList[i].th32ProcessID);
            Attributes['id'] := 'pid';
          end;
          with AddChild('td') do
          begin
            Text := IntToStr(ProcessList[i].cntUsage);
            Attributes['id'] := 'usage';
          end;
          with AddChild('td') do
          begin
            Text := GetProcessCmdLine(ProcessList[i].th32ProcessID);
            Attributes['id'] := 'cmd';
          end;
        end;
      end;
      end;
    end;
    AResponseInfo.ContentText := Xml.XML.Text;
    }Label1.Caption := '������� ' + DateToStr(Now());

  except
    Label1.Caption := '������';
  end;

end;

procedure TForm1.FormCreate(Sender: TObject);
var
  list: TlkJSONlist;
  item: TlkJSONobject;
  json: TlkJSON;
begin


    list := TlkJSONlist.Create;
    item := TlkJSONobject.Create;
    item.Add('pid', 1024);
    item.Add('name', 'paint');
    item.Add('usage', 10);
    item.Add('memory', 150);
    item.Add('params', 'a=12&b=14');
    list.Add(item);

    item := TlkJSONobject.Create;
    item.Add('pid', 1025);
    item.Add('name', 'word');
    item.Add('usage', 15);
    item.Add('memory', 200);
    item.Add('params', 'b=14');
    list.Add(item);
    json := TlkJSON.Create;
    ShowMessage(json.GenerateText(list));
end;

end.
